// Classe Projectile : projectiles tirés par le joueur
// Utilise seek pour viser la position de la souris
class Projectile extends Vehicle {
  constructor(x, y, direction, owner, damage = 20, targetPos = null) {
    // Position exacte du centre du vaisseau
    super(x, y);
    this.owner = owner; // Le joueur qui a tiré
    
    // Vitesse initiale FORTE dans la direction du tir (pour partir directement du vaisseau)
    this.vel = direction.copy();
    this.vel.mult(10); // Vitesse initiale rapide (augmentée de 8 à 10)
    this.maxSpeed = 10; // Augmenté pour correspondre
    
    // Taille petite
    this.r = 5;
    
    // Dégâts (peut être modifié par le joueur)
    this.damage = damage;
    
    // Durée de vie
    this.lifetime = 2; // secondes
    this.age = 0;
    
    // Cible : position de la souris au moment du tir
    this.targetPos = targetPos ? targetPos.copy() : null;
  }

  // Mise à jour du projectile
  update(enemies, obstacles = []) {
    // Si on a une cible (position de la souris), utilise seek pour la suivre
    // Mais avec une force réduite pour que le projectile parte d'abord droit du vaisseau
    if (this.targetPos) {
      let seekForce = this.seek(this.targetPos);
      // Force très réduite au début, puis augmente progressivement
      let seekStrength = min(0.5, this.age * 0.5); // Commence faible, augmente avec l'âge
      this.applyForce(seekForce.mult(seekStrength));
    }
    
    // Obstacle avoidance (légère pour les projectiles)
    if (obstacles && obstacles.length > 0) {
      let avoidForce = this.avoid(obstacles);
      avoidForce.mult(1.5);
      this.applyForce(avoidForce);
    }
    
    // Mise à jour de la position
    super.update();
    
    // Vérifie les collisions avec les obstacles
    for (let obstacle of obstacles) {
      if (obstacle.collidesWithCircle(this.pos, this.r)) {
        this.health = 0; // Détruit le projectile
        return;
      }
    }
    
    // Vérifie les collisions avec les ennemis
    for (let enemy of enemies) {
      if (!enemy.isDead() && this.collidesWith(enemy)) {
        enemy.takeDamage(this.damage);
        this.health = 0; // Détruit le projectile
        return;
      }
    }
    
    // Mise à jour de l'âge
    this.age += deltaTime / 1000; // deltaTime en ms, converti en secondes
    if (this.age >= this.lifetime) {
      this.health = 0; // Détruit le projectile après sa durée de vie
    }
    
    // Wrap-around aux bords
    this.edges();
  }

  // Dessine le projectile
  show() {
    push();
    fill(255, 255, 0);
    stroke(255, 200, 0);
    strokeWeight(1);
    translate(this.pos.x, this.pos.y);
    
    // Cercle pour le projectile
    circle(0, 0, this.r * 2);
    
    // Ligne de direction vers la cible
    if (this.targetPos) {
      stroke(255, 255, 0, 100);
      strokeWeight(1);
      let dir = p5.Vector.sub(this.targetPos, this.pos);
      line(0, 0, dir.x, dir.y);
    }
    
    pop();
  }
}

