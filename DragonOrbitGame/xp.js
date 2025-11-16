// Classe XP : orbes d'expérience laissées par les ennemis morts
// Utilise seek pour être attirées par le joueur
class XPOrb extends Vehicle {
  constructor(x, y, value = 5) {
    super(x, y);
    this.xpValue = value;
    this.r = 8;
    this.maxSpeed = 3;
    this.maxForce = 0.15;
    
    // Vitesse initiale aléatoire
    this.vel = p5.Vector.random2D();
    this.vel.mult(2);
    
    // Attraction vers le joueur
    this.attractionRadius = 100;
    this.collected = false;
  }

  // Mise à jour de l'orb d'XP
  update(player, obstacles = []) {
    let distanceToPlayer = p5.Vector.dist(this.pos, player.pos);
    
    // Si le joueur est proche, attire l'orb
    if (distanceToPlayer < this.attractionRadius) {
      let seekForce = this.seek(player.pos, true); // Arrival behavior
      seekForce.mult(0.2);
      this.applyForce(seekForce);
    }
    
    // Obstacle avoidance
    if (obstacles && obstacles.length > 0) {
      let avoidForce = this.avoid(obstacles);
      avoidForce.mult(2);
      this.applyForce(avoidForce);
    }
    
    // Mise à jour de la position
    super.update();
    
    // Vérifie la collecte par le joueur
    if (this.collidesWith(player)) {
      this.collected = true;
      player.addXP(this.xpValue);
    }
    
    // Wrap-around aux bords
    this.edges();
  }

  // Dessine l'orb d'XP
  show() {
    push();
    fill(0, 255, 255);
    stroke(100, 255, 255);
    strokeWeight(2);
    translate(this.pos.x, this.pos.y);
    circle(0, 0, this.r * 2);
    
    // Effet de brillance
    fill(255, 255, 255, 150);
    noStroke();
    circle(-this.r * 0.3, -this.r * 0.3, this.r);
    pop();
  }
}

