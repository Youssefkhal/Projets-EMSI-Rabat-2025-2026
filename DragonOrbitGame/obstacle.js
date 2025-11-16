// Classe Obstacle : obstacles solides que le joueur ne peut pas traverser
class Obstacle {
  static obstacle1Image = null;
  static obstacle2Image = null;
  static obstacle3Image = null;
  
  constructor(x, y, w, h) {
    this.pos = createVector(x, y);
    this.w = w; // Largeur
    this.h = h; // Hauteur
    
    // Choisit aléatoirement une des 3 images d'obstacle
    let imageIndex = Math.floor(Math.random() * 3) + 1;
    switch(imageIndex) {
      case 1:
        this.image = Obstacle.obstacle1Image;
        break;
      case 2:
        this.image = Obstacle.obstacle2Image;
        break;
      case 3:
        this.image = Obstacle.obstacle3Image;
        break;
      default:
        this.image = Obstacle.obstacle1Image;
    }
  }
  
  // Méthode statique pour charger les images
  static loadImages() {
    Obstacle.obstacle1Image = loadImage('pngs/obstacle1.png');
    Obstacle.obstacle2Image = loadImage('pngs/obstacle2.png');
    Obstacle.obstacle3Image = loadImage('pngs/obstacle3.png');
  }

  // Vérifie si un point est dans l'obstacle
  containsPoint(x, y) {
    return x >= this.pos.x && x <= this.pos.x + this.w &&
           y >= this.pos.y && y <= this.pos.y + this.h;
  }

  // Vérifie la collision avec un cercle (pour le joueur)
  collidesWithCircle(circlePos, circleRadius) {
    // Trouve le point le plus proche sur l'obstacle au cercle
    let closestX = constrain(circlePos.x, this.pos.x, this.pos.x + this.w);
    let closestY = constrain(circlePos.y, this.pos.y, this.pos.y + this.h);
    
    // Distance entre le centre du cercle et le point le plus proche
    let distance = p5.Vector.dist(circlePos, createVector(closestX, closestY));
    
    return distance < circleRadius;
  }

  // Dessine l'obstacle
  show() {
    push();
    
    // Dessine l'image si elle est chargée, sinon dessine un rectangle par défaut
    if (this.image) {
      imageMode(CORNER);
      image(this.image, this.pos.x, this.pos.y, this.w, this.h);
    } else {
      // Fallback au rectangle marron si l'image n'est pas chargée
      fill(100, 50, 50);
      stroke(150, 80, 80);
      strokeWeight(2);
      rect(this.pos.x, this.pos.y, this.w, this.h);
    }
    
    pop();
  }
}

