// Classe Ability : capacités spéciales du joueur
// Exemples : armes orbitales, zone de dégâts, etc.
class Ability {
  constructor(type, player) {
    this.type = type;
    this.player = player;
    this.active = true;
    
    // Configuration selon le type
    switch(type) {
      case 'orbital':
        this.orbitalRadius = 60;
        this.orbitalSpeed = 0.1;
        this.angle = 0;
        this.damage = 15;
        this.cooldown = 0.3;
        this.lastHitTime = {};
        break;
      case 'aoe':
        this.radius = 80;
        this.damage = 30;
        this.cooldown = 2;
        this.lastActivation = 0;
        break;
    }
  }

  update(player) {
    this.player = player;
    
    switch(this.type) {
      case 'orbital':
        this.angle += this.orbitalSpeed;
        break;
      case 'aoe':
        // Activation périodique
        let currentTime = millis() / 1000;
        if (currentTime - this.lastActivation >= this.cooldown) {
          this.activateAOE();
          this.lastActivation = currentTime;
        }
        break;
    }
  }

  // Active l'AOE autour du joueur
  activateAOE() {
    // Cette méthode sera appelée depuis gameManager pour infliger des dégâts
    // aux ennemis dans le rayon
  }

  // Vérifie les collisions avec les ennemis (pour orbital)
  checkCollisions(enemies) {
    if (this.type !== 'orbital') return;
    
    let currentTime = millis() / 1000;
    let orbitalPos = this.getOrbitalPosition();
    
    for (let enemy of enemies) {
      if (enemy.isDead()) continue;
      
      let enemyId = enemy;
      if (!this.lastHitTime[enemyId]) {
        this.lastHitTime[enemyId] = 0;
      }
      
      // Vérifie la collision et le cooldown
      if (enemy.collidesWithPoint(orbitalPos, this.player.r) &&
          currentTime - this.lastHitTime[enemyId] >= this.cooldown) {
        enemy.takeDamage(this.damage);
        this.lastHitTime[enemyId] = currentTime;
      }
    }
  }

  // Retourne la position de l'arme orbitale
  getOrbitalPosition() {
    if (this.type !== 'orbital') return null;
    
    let x = this.player.pos.x + cos(this.angle) * this.orbitalRadius;
    let y = this.player.pos.y + sin(this.angle) * this.orbitalRadius;
    return createVector(x, y);
  }

  show() {
    switch(this.type) {
      case 'orbital':
        let pos = this.getOrbitalPosition();
        if (pos) {
          push();
          fill(255, 200, 0);
          stroke(255, 255, 0);
          strokeWeight(2);
          circle(pos.x, pos.y, 15);
          pop();
        }
        break;
      case 'aoe':
        // Cercle autour du joueur (pulsation)
        push();
        noFill();
        stroke(255, 100, 100, 150);
        strokeWeight(2);
        let pulse = sin(millis() / 200) * 5;
        circle(this.player.pos.x, this.player.pos.y, this.radius * 2 + pulse);
        pop();
        break;
    }
  }
}

