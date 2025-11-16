// Classe HealthOrb : orbes de santé laissées par les ennemis morts
// Utilise seek pour être attirées par le joueur
class HealthOrb extends Vehicle {
  constructor(x, y, value = 10) {
    super(x, y);
    this.healthValue = value;
    this.r = 10;
    this.maxSpeed = 3;
    this.maxForce = 0.15;
    
    // Vitesse initiale aléatoire
    this.vel = p5.Vector.random2D();
    this.vel.mult(2);
    
    // Attraction vers le joueur
    this.attractionRadius = 100;
    this.collected = false;
  }

  // Mise à jour de l'orb de santé
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
      player.heal(this.healthValue); // Restaure la santé du joueur
    }
    
    // Wrap-around aux bords
    this.edges();
  }

  // Dessine l'orb de santé
  show() {
    push();
    fill(255, 0, 0); // Rouge pour la santé
    stroke(255, 100, 100);
    strokeWeight(2);
    translate(this.pos.x, this.pos.y);
    circle(0, 0, this.r * 2);
    
    // Effet de brillance
    fill(255, 200, 200, 150);
    noStroke();
    circle(-this.r * 0.3, -this.r * 0.3, this.r);
    
    // Croix de santé au centre
    stroke(255, 255, 255);
    strokeWeight(2);
    line(-this.r * 0.5, 0, this.r * 0.5, 0);
    line(0, -this.r * 0.5, 0, this.r * 0.5);
    
    pop();
  }
}
