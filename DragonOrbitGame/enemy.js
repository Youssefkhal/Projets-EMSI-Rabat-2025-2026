// Classe Enemy : ennemis avec différents comportements de steering
// Utilise pursue, wander, evade, flock selon le type d'ennemi
class Enemy extends Vehicle {
  static enemy1Image = null; // Image pour les tanks (carré bleu)
  static enemy2Image = null; // Image pour les autres ennemis (flèche rouge)
  
  constructor(x, y, type = 'basic') {
    super(x, y);
    this.type = type;
    
    // Configuration selon le type
    switch(type) {
      case 'fast':
        this.maxSpeed = 3;
        this.maxForce = 0.15;
        this.r = 12;
        this.health = 30;
        this.maxHealth = 30;
        this.detectionRadius = 300;
        break;
      case 'tank':
        this.maxSpeed = 1.5;
        this.maxForce = 0.08;
        this.r = 30;
        this.health = 150;
        this.maxHealth = 150;
        this.detectionRadius = 400;
        break;
      case 'wanderer':
        this.maxSpeed = 2;
        this.maxForce = 0.1;
        this.r = 15;
        this.health = 40;
        this.maxHealth = 40;
        this.detectionRadius = 200;
        break;
      default: // 'basic'
        this.maxSpeed = 2;
        this.maxForce = 0.1;
        this.r = 18;
        this.health = 50;
        this.maxHealth = 50;
        this.detectionRadius = 250;
    }
    
    // Comportement actuel
    this.behaviorState = 'wander'; // 'wander', 'pursue', 'evade'
    this.wanderAngle = random(TWO_PI);
    this.wanderChange = 0.3;
    
    // XP donnée à la mort
    this.xpValue = 5;
    
    // Dégâts infligés au joueur
    this.damage = 10;
    
    // Cooldown d'attaque
    this.attackCooldown = 0;
    this.attackRate = 1.5; // secondes
  }

  // Applique les comportements selon l'état
  applyBehaviors(player, enemies) {
    let force = createVector(0, 0);
    let distanceToPlayer = p5.Vector.dist(this.pos, player.pos);
    
    // Décision de comportement selon le type
    switch(this.type) {
      case 'basic':
        if (distanceToPlayer < this.detectionRadius) {
          // Pursue le joueur
          force = this.pursue(player);
          this.behaviorState = 'pursue';
        } else {
          // Wander si trop loin
          force = this.wander();
          this.behaviorState = 'wander';
        }
        break;
        
      case 'fast':
        if (distanceToPlayer < this.detectionRadius) {
          // Pursue agressif
          force = this.pursue(player, 15);
          this.behaviorState = 'pursue';
        } else {
          force = this.wander();
          this.behaviorState = 'wander';
        }
        break;
        
      case 'tank':
        if (distanceToPlayer < this.detectionRadius) {
          // Pursue lent mais persistant
          force = this.pursue(player, 20);
          this.behaviorState = 'pursue';
        } else {
          force = this.wander();
          this.behaviorState = 'wander';
        }
        break;
        
      case 'wanderer':
        // Wander avec parfois un peu de pursue
        if (distanceToPlayer < this.detectionRadius * 0.5) {
          // Si très proche, pursue
          force = this.pursue(player);
          this.behaviorState = 'pursue';
        } else {
          // Sinon wander
          force = this.wander();
          this.behaviorState = 'wander';
        }
        break;
    }
    
    // Séparation avec les autres ennemis (évite le clustering)
    if (enemies && enemies.length > 1) {
      let separation = this.separate(enemies, this.r * 3);
      force.add(separation.mult(0.5));
    }
    
    this.applyForce(force);
  }

  // Wander amélioré avec angle progressif
  wander() {
    // Cercle devant le véhicule
    let wanderPoint = this.vel.copy();
    if (wanderPoint.mag() < 0.1) {
      wanderPoint = p5.Vector.fromAngle(this.wanderAngle);
    }
    wanderPoint.normalize();
    wanderPoint.mult(50);
    wanderPoint.add(this.pos);

    // Variation de l'angle
    this.wanderAngle += random(-this.wanderChange, this.wanderChange);
    let angle = this.wanderAngle;
    
    // Point sur le cercle
    let wanderRadius = 30;
    wanderPoint.x += cos(angle) * wanderRadius;
    wanderPoint.y += sin(angle) * wanderRadius;

    return this.seek(wanderPoint);
  }

  // Mise à jour de l'ennemi
  update(player, enemies, obstacles = []) {
    // Applique les comportements
    this.applyBehaviors(player, enemies);
    
    // Obstacle avoidance
    let avoidForce = this.avoid(obstacles);
    avoidForce.mult(3);
    this.applyForce(avoidForce);
    
    // Boundaries
    let boundariesForce = this.boundaries();
    boundariesForce.mult(3);
    this.applyForce(boundariesForce);
    
    // Sauvegarde la position précédente pour la collision
    let prevPos = this.pos.copy();
    
    // Mise à jour de la position
    super.update();
    
    // Vérifie les collisions avec les obstacles (backup collision detection)
    for (let obstacle of obstacles) {
      if (obstacle.collidesWithCircle(this.pos, this.r)) {
        // Collision détectée, revient à la position précédente
        this.pos = prevPos;
        // Arrête la vitesse dans la direction de l'obstacle
        this.vel.mult(0.3);
        break;
      }
    }
    
    // Wrap-around aux bords
    this.edges();
    
    // Mise à jour du cooldown d'attaque
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime / 1000; // deltaTime en ms, converti en secondes
    }
  }

  // Attaque le joueur si en contact
  attack(player) {
    if (this.collidesWith(player) && this.attackCooldown <= 0) {
      player.takeDamage(this.damage);
      this.attackCooldown = this.attackRate;
      return true;
    }
    return false;
  }

  // Méthode statique pour charger les images
  static loadImages() {
    Enemy.enemy1Image = loadImage('pngs/enemy1.gif');
    Enemy.enemy2Image = loadImage('pngs/enemy2.gif');
  }

  // Dessine l'ennemi
  show() {
    push();
    
    // Cercle de détection (debug)
    if (Vehicle.debug && this.behaviorState === 'pursue') {
      noFill();
      stroke(255, 100);
      strokeWeight(1);
      circle(this.pos.x, this.pos.y, this.detectionRadius * 2);
    }
    
    // Barre de santé
    let healthPercent = this.health / this.maxHealth;
    fill(255, 0, 0);
    noStroke();
    rect(this.pos.x - this.r, this.pos.y - this.r - 8, this.r * 2 * healthPercent, 4);
    
    // Corps de l'ennemi - Image
    translate(this.pos.x, this.pos.y);
    
    // Rotation selon le type
    if (this.type === 'tank') {
      // Tank enemy rotate avec le temps
      rotate(millis() * 0.001); // Rotation continue
    } else {
      // Autres ennemis suivent leur direction de mouvement
      rotate(this.vel.heading());
    }
    
    // Sélection de l'image selon le type
    let enemyImage = null;
    if (this.type === 'tank') {
      // enemy1.gif pour les tanks (carré bleu)
      enemyImage = Enemy.enemy1Image;
    } else {
      // enemy2.gif pour les autres ennemis (flèche rouge)
      enemyImage = Enemy.enemy2Image;
    }
    
    // Dessine l'image si elle est chargée, sinon dessine la forme par défaut
    if (enemyImage) {
      imageMode(CENTER);
      let imgSize = this.r * 2;
      image(enemyImage, 0, 0, imgSize, imgSize);
    } else {
      // Fallback aux formes géométriques si l'image n'est pas chargée
      let color;
      switch(this.type) {
        case 'fast':
          color = [255, 100, 100];
          break;
        case 'tank':
          color = [100, 100, 255];
          break;
        case 'wanderer':
          color = [100, 255, 100];
          break;
        default:
          color = [255, 50, 50];
      }
      
      fill(color[0], color[1], color[2]);
      stroke(255);
      strokeWeight(2);
      
      if (this.type === 'tank') {
        // Carré pour les tanks
        rectMode(CENTER);
        rect(0, 0, this.r * 2, this.r * 2);
      } else {
        // Triangle pour les autres
        triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
      }
    }
    
    pop();
  }
}

