// Classe Player : le joueur contrôlé au clavier
// Utilise les comportements de steering pour un mouvement fluide
class Player extends Vehicle {
  static shooterImage = null; // Image de base (shouter.png)
  static up2Image = null; // Image niveau 2 (up2.png) - 5 kills
  static up3Image = null; // Image niveau 3 (up3.png) - 10 kills
  
  constructor(x, y) {
    super(x, y);
    this.maxSpeed = 5;
    this.maxForce = 0.2;
    this.r = 20;
    this.health = 100;
    this.maxHealth = 100;
    
    // Système de tir automatique
    this.fireRate = 0.5; // secondes entre chaque tir
    this.lastFireTime = 0;
    this.projectiles = [];
    
    // Niveau et XP
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 10;
    
    // Capacités/armes
    this.abilities = [];
    
    // Système de kills et amélioration d'arme
    this.kills = 0;
    this.weaponUpgradeLevel = 0; // 0 = base, 1+ = amélioré
    this.baseProjectileDamage = 20;
    
    // Suivi de la position de la souris pour détecter l'arrêt
    this.lastMousePos = createVector(0, 0);
    this.mouseMoveThreshold = 2; // Seuil de mouvement (pixels)
    this.mouseStopped = false;
  }
  
  // Améliore l'arme après 10 kills
  upgradeWeapon() {
    this.weaponUpgradeLevel++;
    this.baseProjectileDamage += 15; // +15 dégâts par amélioration
    console.log("Weapon upgraded! Damage: " + this.baseProjectileDamage);
  }
  
  // Ajoute un kill et vérifie l'amélioration
  addKill() {
    this.kills++;
    // Amélioration à 10, 20, 30 kills, etc.
    if (this.kills % 10 === 0) {
      this.upgradeWeapon();
    }
  }
  
  // Retourne l'image actuelle selon le nombre de kills
  getCurrentImage() {
    if (this.kills >= 10) {
      return Player.up3Image;
    } else if (this.kills >= 5) {
      return Player.up2Image;
    } else {
      return Player.shooterImage;
    }
  }
  
  // Méthode statique pour charger toutes les images
  static loadImage() {
    Player.shooterImage = loadImage('pngs/shouter.png');
    Player.up2Image = loadImage('pngs/up2.png');
    Player.up3Image = loadImage('pngs/up3.png');
  }

  // Mise à jour du joueur
  update(obstacles = []) {
    // Détecte si la souris s'est arrêtée
    let mousePos = createVector(mouseX, mouseY);
    let mouseMovement = p5.Vector.dist(mousePos, this.lastMousePos);
    
    // Si le mouvement est inférieur au seuil, la souris est considérée comme arrêtée
    this.mouseStopped = mouseMovement < this.mouseMoveThreshold;
    
    // Le vaisseau suit la souris en utilisant seek ou arrive selon le mouvement
    let seekForce;
    if (this.mouseStopped) {
      // Utilise arrival behavior quand la souris s'arrête
      seekForce = this.seek(mousePos, true);
    } else {
      // Utilise seek normal quand la souris bouge
      seekForce = this.seek(mousePos, false);
    }
    seekForce.mult(0.2);
    this.applyForce(seekForce);
    
    // Mise à jour de la position de la souris pour la prochaine frame
    this.lastMousePos = mousePos.copy();
    
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
    
    // Limites de l'écran (pas de wrap-around pour le joueur)
    this.pos.x = constrain(this.pos.x, this.r, width - this.r);
    this.pos.y = constrain(this.pos.y, this.r, height - this.r);
    
    // Mise à jour des capacités
    for (let ability of this.abilities) {
      ability.update(this);
    }
  }

  // Tir manuel vers la position de la souris (appelé avec la barre d'espace)
  fire() {
    let currentTime = millis() / 1000;
    if (currentTime - this.lastFireTime >= this.fireRate) {
      let mousePos = createVector(mouseX, mouseY);
      let direction = p5.Vector.sub(mousePos, this.pos);
      
      if (direction.mag() > 0) {
        // Normalise la direction
        direction.normalize();
        
        // Crée le projectile exactement au centre du vaisseau
        let projectile = new Projectile(
          this.pos.x,  // Position X exacte du centre du vaisseau
          this.pos.y,  // Position Y exacte du centre du vaisseau
          direction,   // Direction normalisée vers la souris
          this,
          this.baseProjectileDamage,
          mousePos // Passer la position de la souris comme cible
        );
        this.projectiles.push(projectile);
        this.lastFireTime = currentTime;
      }
    }
  }

  // Ajoute de l'XP et gère le level up
  addXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.levelUp();
    }
  }

  // Level up : augmente les stats et offre un choix d'amélioration
  levelUp() {
    this.level++;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
    
    // Amélioration des stats
    this.maxSpeed += 0.2;
    this.fireRate *= 0.95; // Tir plus rapide
    this.maxHealth += 10;
    this.heal(20);
    
    // TODO: Système de choix d'amélioration (à implémenter dans gameManager)
    console.log("Level up! Level:", this.level);
  }

  // Dessine le joueur
  show() {
    push();
    // Cercle de santé
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.r * 2.5);
    
    // Barre de santé
    let healthPercent = this.health / this.maxHealth;
    fill(255, 0, 0);
    noStroke();
    rect(this.pos.x - this.r, this.pos.y - this.r - 8, this.r * 2 * healthPercent, 4);
    
    // Corps du joueur - Image
    translate(this.pos.x, this.pos.y);
    
    // Orientation vers la souris
    let mousePos = createVector(mouseX, mouseY);
    let direction = p5.Vector.sub(mousePos, this.pos);
    if (direction.mag() > 0) {
      rotate(direction.heading() + PI / 2); // +PI/2 pour orienter l'image vers la souris
    }
    
    // Dessine l'image actuelle selon le nombre de kills
    let currentImage = this.getCurrentImage();
    if (currentImage) {
      imageMode(CENTER);
      let imgSize = this.r * 2;
      image(currentImage, 0, 0, imgSize, imgSize);
    } else {
      // Fallback au triangle si l'image n'est pas chargée
      fill(0, 150, 255);
      stroke(255);
      strokeWeight(2);
      triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    }
    
    pop();
    
    // Dessine les capacités
    for (let ability of this.abilities) {
      ability.show();
    }
  }
}

