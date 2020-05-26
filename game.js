//Position class
class Position {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    //Fonction d'ajout : ajouter une meme valeur aux coordonnées x et y
    add(addition) {
        return new Position(this.x + addition, this.y + addition);
    }
    //Ajoute une position (valeur spécifique x et valeur spécifique y) aux coordonnées respectives x et y
    addPosition(pos = Position()) {
        return new Position(this.x + pos.x, this.y + pos.y);
    }
    //Multiplie les coordonnées x et y par une valeur->facteur
    mult(factor) {
        return new Position(this.x * factor, this.y * factor);
    }
    //Divise les coordonnées x et y par une valeur->facteur
    div(factor) {
        return new Position(this.x / factor, this.y / factor);
    }
    //Renvoie vecteur allant de la position actuelle à la position cible
    vectorTo(target = Position()) {
        return new Position(target.x - this.x, target.y - this.y);
    }
    //Renvoie la distance entre cette position et la position cible
    distanceTo(target = Position()) {
        return Math.sqrt(Math.pow(this.x - target.x, 2) + Math.pow(this.y - target.y, 2));
    }
    //Normalise le vecteur
    normalizedVectorTo(target = Position()) {
        return this.vectorTo(target).div(this.distanceTo(target));
    }
}

//Sprite class
class Sprite {
    constructor(imgPath = "", insideDOM = document.getElementById("playground"), hitBoxRadius) {
        this.imgPath = imgPath; 
        this.DOM = document.createElement("img");
        this.DOM.src = this.imgPath;//create and add image as DOM element
        this.hitBoxRadius = hitBoxRadius //refers to half of the image width(image is square)
        this.pos = new Position(0, 0); // Position at first set at zero
        this.insideDOM = insideDOM;
        this.insideDOM.appendChild(this.DOM);
    }
    //Passer à la position requise, compte tenu du css
    moveTo(newPos = Position()){
        this.pos = newPos;
        this.DOM.style.top = newPos.y + "px";
        this.DOM.style.left = newPos.x + "px";
    }
    //Faire pivoter l'image selon un certain angle en fonction des mouvements de la souris
    rotate(angle) {
        this.DOM.style.transform = "rotate("+angle+"deg)";
    }

    update(){}

    //Si la distance entre deux Sprites est supérieure aux deux rayons d'images ajoutés, alors les images ne sont pas en collision. 
    //Des hitboxes rondes.
    //Si les images entrent en collision, retourner vrai. Sinon, retournez Faux.
    isColliding(otherSprite = Sprite()){
        let distanceBtwSprites = this.pos.add(this.hitBoxRadius).distanceTo(otherSprite.pos.add(otherSprite.hitBoxRadius));
        return distanceBtwSprites <= this.hitBoxRadius + otherSprite.hitBoxRadius;
    }

    //Positionnez le Sprite à une position aléatoire entre 0 et innerWidth (prenez en considération la largeur des images)
    gotoRandomPosition() {
        this.moveTo(new Position(randomNumberBtw(0, window.innerWidth - this.hitBoxRadius*2), randomNumberBtw(0, window.innerHeight - this.hitBoxRadius*2)))
    }
}

//XWing / Player
class XWing extends Sprite {
    constructor(imgPath = "data/x_wing.png", insideDOM = document.getElementById("playground"), hitBoxRadius = 64) {
        super(imgPath, insideDOM, hitBoxRadius);
    }

    update() {
        this.lookAt(game.mousePosition);
        if (game.leftMouseButtonDown) {
            let centerPosition = this.pos.add(this.hitBoxRadius);
            //Permet de déplacer l'image vers la position de la souris lorsqu'on appuie dessus. Déplacement à la vitesse de 10
            if(centerPosition.distanceTo(game.mousePosition) > this.hitBoxRadius){
                let mvmtVector = centerPosition.normalizedVectorTo(game.mousePosition).mult(10);
                this.moveTo(this.pos.addPosition(mvmtVector));
            }
        }
    }
    //faire tourner l'image XWing en fonction de la position de la souris
    lookAt(targetPos = Position()) {
        let angle = Math.atan2(this.pos.y + this.hitBoxRadius - targetPos.y, this.pos.x + this.hitBoxRadius - targetPos.x) * 180.0 / Math.PI;
        this.rotate((angle + 90) % 360);
    }
}

//DarthVader / Enemy
class DarthVader extends Sprite {
    constructor(target, imgPath = "data/darthvader.png", insideDOM = document.getElementById("playground"), hitBoxRadius = 64) {
        super(imgPath, insideDOM, hitBoxRadius);
        this.target = target;
        this.gotoRandomPosition();
    }

    update() {
        //Suivre la position actuelle du Xwing avec une vitesse de 4
        let centerPosition = this.pos.add(this.hitBoxRadius);
        let mvmtVector = centerPosition.normalizedVectorTo(this.target.pos.add(this.target.hitBoxRadius)).mult(4);
        this.moveTo(this.pos.addPosition(mvmtVector));
    }
    //Supprimer Image de DOM
    deleteSelf() {
        this.insideDOM.removeChild(this.DOM);
    }
}

//Generate random numbers between min & max
function randomNumberBtw(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//Game var
var game = {
    //Poser les bases du jeu
    run: true,
    leftMouseButtonDown: false,
    mousePosition: new Position(0, 0),
    xwing: null,
    R2D2: null,
    dv: null,
    score: 0,
    //sauvegarde de la tFrame precedente
    lastTFrame: 0,
    //1 min en ms
    timeLeft: 60000,
    //si le premier score n'a pas été enregistré, le temps ne commence pas. Controlé par le valeur boolean
    timerActive: false,

    mainLoop: function(tFrame) {
        let cbId = window.requestAnimationFrame(game.mainLoop);
        if (!game.run || game.timeLeft <= 0) {
            window.cancelAnimationFrame(cbId);
        } else {
            game.update(tFrame);
        }
    },

    update: function(tFrame) {
        game.xwing.update();

        //Lorsque R2D2 et XWing entrent en collision, inscrivez le score et supprimez le 
        if(game.xwing.isColliding(game.R2D2)) {
            game.R2D2.gotoRandomPosition();
            game.score++;
            game.updateScore();
            game.timerActive = true;
        }
        //Si le score est >4 et que la DV existe dans le jeu, vérifiez si XWing et DV entrent en collision. 
        //Si c'est le cas, enlevez 5 points du score et retirez DV de la position actuelle.
        if(game.dv != null) {
            game.dv.update();
            if(game.xwing.isColliding(game.dv)) {
                game.score -= 5;
                game.dv.deleteSelf();
                game.dv = null;
                game.updateScore();
            }
        }
        //Pour faire diminuer le temps, la variable timeLeft est diminuée à chaque tour de boucle par la difference entre la tFrame actuelle 
        //et la dernière valeur de celle-ci. qui a été enregistrée sur une variable temporaire nommée lastTFrame  
        if(game.timerActive) {
            game.timeLeft -= tFrame - game.lastTFrame; 
        }        
        //la valeur actuelle de tFrame est enregistrée comme valeur de lastTFrame pour être utilisée dans le prochain updateTimer
        game.lastTFrame = tFrame;
        game.updateTimer();
        ///Si le chronomètre atteint zéro, alors le jeu est terminé et le score est calculé. 
        //Si le score actuel est superieur au score le plus élevé, il est sauvegardé dans des cookies
        //Sinon, affichez le meilleur score et un message de réessai
        if(game.timeLeft <= 0) {
            document.getElementById("playground").style.filter = "grayscale(60%)";
            document.getElementById("pause").innerHTML = "You scored " + game.score + "<br />";
            if(game.score > document.cookie){
                document.cookie = game.score;
                document.getElementById("endMessage").innerHTML += "New highscore, you rock";
            }else{
                document.getElementById("endMessage").innerHTML += "Highscore is "+ document.cookie +", try again";
            }
            document.getElementById("pause").style.visibility = "visible"; 
        }
    },

    updateScore: function(){
        document.getElementById("score").innerHTML = game.score;
        if(game.score >= 5 && game.dv == null) {
            //si le score est >= 5, créer un objet DV 
            game.dv = new DarthVader(game.xwing);
        }
    },
    //Formater l'heure affichée
    updateTimer: function(){
        let seconds = game.timeLeft / 1000;
        let minutes = seconds / 60;
        let secondsFormatted = (seconds % 60 < 10 ? "0" : "") + (seconds < 0 ? '0' : Math.floor(seconds % 60));
        let minutesFormatted = minutes < 0 ? '0' : Math.floor(minutes);
        document.getElementById("timer").innerHTML = Math.floor(minutesFormatted) + ":" + secondsFormatted;
    },
    //Mouse events 
    //Event qui rend possible le déplacement des sprints
    mouseMove: function(event) {
        game.mousePosition = new Position(event.clientX, event.clientY);
    },
    //Bouton gauche de la souris cliqué quand 1 est relancé 
    mouseButton: function(event) {
        game.leftMouseButtonDown = event.buttons == 1;
    },
    //Pause du jeu : appuyez sur la touche ESCAPE. Retournez au jeu en faisant de même
    keyDown: function(event) {
        if(event.keyCode == 27 && game.timeLeft > 0) { //Press escape to put on pause
            if(game.run) {
                game.run = false;
                document.getElementById("playground").style.filter = "grayscale(60%)";
                document.getElementById("pause").style.visibility = "visible"; 
            } else {
                game.run = true;
                document.getElementById("playground").style.filter = "none";
                document.getElementById("pause").style.visibility = "hidden";
                game.lastTFrame = event.timeStamp;
                game.mainLoop(game.lastTFrame);
            }
        }
    }
};

//Initializing
window.onload = function() {
    //Adding event listeners
    document.addEventListener("mousemove", game.mouseMove);
    document.addEventListener("mousedown", game.mouseButton);
    document.addEventListener("mouseup", game.mouseButton);
    document.addEventListener("keydown", game.keyDown);

    //Game objects    
    game.xwing = new XWing();
    game.xwing.moveTo(new Position(window.innerWidth/2, window.innerHeight/2));

    game.R2D2 = new Sprite("data/R2D2.png", insideDOM = document.getElementById("playground"), 41);
    game.R2D2.gotoRandomPosition();

    //start
    game.mainLoop(0);
}
