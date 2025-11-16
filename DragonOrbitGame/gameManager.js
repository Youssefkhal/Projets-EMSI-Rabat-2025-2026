// Classe GameManager : gère l'état du jeu, les vagues, le spawn, etc.
class GameManager {
  constructor() {
    this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameover'
    this.isPaused = false;
    this.wave = 1;
    this.enemiesPerWave = 20; // Augmenté de 5 à 20
    this.enemySpawnRate = 1.5; // secondes entre chaque spawn (réduit de 2 à 1.5)
    this.lastSpawnTime = 0;
    this.enemiesSpawnedThisWave = 0;
    
    // Types d'ennemis avec probabilités
    this.enemyTypes = [
      { type: 'basic', weight: 50 },
      { type: 'fast', weight: 25 },
      { type: 'tank', weight: 15 },
      { type: 'wanderer', weight: 10 }
    ];
    
    // Timer de vague
    this.waveDuration = 30; // secondes
    this.waveStartTime = 0;
    
    // Score
    this.score = 0;
    this.enemiesKilled = 0;
    
    // Système d'achievements (3 niveaux)
    this.achievements = {
      level1: false, // 10 kills
      level2: false, // 25 kills
      level3: false  // 50 kills
    };
    this.achievementUnlocked = false; // Pour afficher l'écran d'achievement
    this.achievementLevel = 0;
    
    // Multiplicateur de dégâts des ennemis (augmente avec les kills)
    this.enemyDamageMultiplier = 1.0;
  }

  // Démarre une nouvelle partie
  startGame() {
    this.gameState = 'playing';
    this.wave = 1;
    this.enemiesPerWave = 5;
    this.enemiesSpawnedThisWave = 0;
    this.lastSpawnTime = 0;
    this.waveStartTime = millis() / 1000;
    this.score = 0;
    this.enemiesKilled = 0;
    this.achievements = { level1: false, level2: false, level3: false };
    this.achievementUnlocked = false;
    this.achievementLevel = 0;
    this.enemyDamageMultiplier = 1.0;
  }
  
  // Vérifie et débloque les achievements
  checkAchievements(player) {
    let newAchievement = false;
    
    // Level 1: 10 kills (facile)
    if (!this.achievements.level1 && player.kills >= 10) {
      this.achievements.level1 = true;
      this.achievementLevel = 1;
      this.achievementUnlocked = true;
      newAchievement = true;
      this.enemyDamageMultiplier = 1.2; // Ennemis font 20% plus de dégâts
    }
    
    // Level 2: 25 kills (moyen)
    if (!this.achievements.level2 && player.kills >= 25) {
      this.achievements.level2 = true;
      this.achievementLevel = 2;
      this.achievementUnlocked = true;
      newAchievement = true;
      this.enemyDamageMultiplier = 1.5; // Ennemis font 50% plus de dégâts
    }
    
    // Level 3: 50 kills (difficile)
    if (!this.achievements.level3 && player.kills >= 50) {
      this.achievements.level3 = true;
      this.achievementLevel = 3;
      this.achievementUnlocked = true;
      newAchievement = true;
      this.enemyDamageMultiplier = 2.0; // Ennemis font 100% plus de dégâts
    }
    
    return newAchievement;
  }
  
  // Retourne le nombre d'achievements débloqués
  getAchievementCount() {
    let count = 0;
    if (this.achievements.level1) count++;
    if (this.achievements.level2) count++;
    if (this.achievements.level3) count++;
    return count;
  }

  // Retourne un type d'ennemi aléatoire selon les poids
  getRandomEnemyType() {
    let totalWeight = 0;
    for (let enemyType of this.enemyTypes) {
      totalWeight += enemyType.weight;
    }
    
    let random = Math.random() * totalWeight;
    let currentWeight = 0;
    
    for (let enemyType of this.enemyTypes) {
      currentWeight += enemyType.weight;
      if (random <= currentWeight) {
        return enemyType.type;
      }
    }
    
    return 'basic';
  }

  // Spawn un ennemi à une position aléatoire en bordure
  spawnEnemy() {
    let side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
      case 0: // Haut
        x = Math.random() * width;
        y = -20;
        break;
      case 1: // Droite
        x = width + 20;
        y = Math.random() * height;
        break;
      case 2: // Bas
        x = Math.random() * width;
        y = height + 20;
        break;
      case 3: // Gauche
        x = -20;
        y = Math.random() * height;
        break;
    }
    
    let type = this.getRandomEnemyType();
    let enemy = new Enemy(x, y, type);
    // Applique le multiplicateur de dégâts
    enemy.damage = Math.floor(enemy.damage * this.enemyDamageMultiplier);
    return enemy;
  }

  // Vérifie si on doit spawner un nouvel ennemi
  shouldSpawnEnemy() {
    if (this.gameState !== 'playing') return false;
    
    let currentTime = millis() / 1000;
    
    // Spawn si le cooldown est écoulé et qu'on n'a pas atteint le max de la vague
    if (currentTime - this.lastSpawnTime >= this.enemySpawnRate &&
        this.enemiesSpawnedThisWave < this.enemiesPerWave) {
      this.lastSpawnTime = currentTime;
      this.enemiesSpawnedThisWave++;
      return true;
    }
    
    return false;
  }

  // Vérifie si la vague est terminée
  isWaveComplete(enemies) {
    let aliveEnemies = enemies.filter(e => !e.isDead()).length;
    let currentTime = millis() / 1000;
    let waveTime = currentTime - this.waveStartTime;
    
    // Vague terminée si tous les ennemis sont morts et le temps est écoulé
    return aliveEnemies === 0 && 
           this.enemiesSpawnedThisWave >= this.enemiesPerWave &&
           waveTime >= this.waveDuration;
  }

  // Passe à la vague suivante
  nextWave() {
    this.wave++;
    this.enemiesPerWave = Math.floor(20 + this.wave * 5); // Augmenté : 20 de base + 5 par vague
    this.enemiesSpawnedThisWave = 0;
    this.lastSpawnTime = 0;
    this.waveStartTime = millis() / 1000;
    this.enemySpawnRate = Math.max(0.5, 1.5 - this.wave * 0.05); // Spawn plus rapide (base 1.5 au lieu de 2)
    
    // Augmente les poids des ennemis difficiles
    for (let enemyType of this.enemyTypes) {
      if (enemyType.type === 'tank' || enemyType.type === 'fast') {
        enemyType.weight += 2;
      }
    }
  }

  // Enregistre la mort d'un ennemi
  enemyKilled(enemy) {
    this.enemiesKilled++;
    this.score += enemy.xpValue * 10;
  }

  // Vérifie la fin de partie
  checkGameOver(player) {
    if (player.isDead()) {
      this.gameState = 'gameover';
      return true;
    }
    return false;
  }

  // Toggle pause
  togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.isPaused = true;
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.isPaused = false;
    }
  }

  // Dessine l'UI du jeu
  drawUI(player) {
    push();
    fill(255);
    textSize(16);
    textAlign(LEFT);
    
    // Score
    text("Score: " + this.score, 10, 30);
    
    // Vague
    text("Wave: " + this.wave, 10, 50);
    
    // Ennemis restants
    text("Enemies Killed: " + this.enemiesKilled, 10, 70);
    text("Kills: " + player.kills, 10, 90);
    
    // Level du joueur
    text("Level: " + player.level, 10, 110);
    text("XP: " + player.xp + " / " + player.xpToNextLevel, 10, 130);
    
    // Dégâts de l'arme
    text("Weapon Damage: " + player.baseProjectileDamage, 10, 150);
    
    // Santé
    let healthPercent = player.health / player.maxHealth;
    fill(255, 0, 0);
    rect(10, 170, 200, 20);
    fill(0, 255, 0);
    rect(10, 170, 200 * healthPercent, 20);
    fill(255);
    text("Health: " + Math.floor(player.health) + " / " + player.maxHealth, 15, 185);
    
    // Instructions
    textAlign(LEFT);
    textSize(12);
    fill(200);
    text("Mouse: Move | Left Click: Shoot | ESC: Pause", 10, height - 20);
    
    pop();
  }

  // Dessine l'écran de menu
  drawMenu() {
    push();
    background(0, 100);
    
    fill(255);
    textSize(32);
    textAlign(CENTER);
    text("SPACE SHOOTER", width / 2, height / 2 - 50);
    
    textSize(18);
    text("Press SPACE to Start", width / 2, height / 2 + 20);
    text("Press F to Toggle Debug", width / 2, height / 2 + 50);
    
    pop();
  }

  // Dessine l'écran de pause avec toutes les infos
  drawPauseScreen(player) {
    push();
    
    // Fond semi-transparent
    fill(0, 0, 0, 200);
    noStroke();
    rect(0, 0, width, height);
    
    // Titre
    fill(255, 255, 0);
    textSize(48);
    textAlign(CENTER);
    textStyle(BOLD);
    text("PAUSED", width / 2, 60);
    textStyle(NORMAL);
    
    let startY = 120;
    let spacing = 25;
    let leftCol = width / 4;
    let rightCol = width * 3 / 4;
    
    fill(255);
    textSize(20);
    
    // Section: Game Info
    fill(255, 200, 0);
    textSize(24);
    text("GAME INFO", width / 2, startY);
    
    fill(255);
    textSize(18);
    textAlign(LEFT);
    text("Wave: " + this.wave, leftCol, startY + spacing);
    text("Score: " + this.score, leftCol, startY + spacing * 2);
    text("Enemies Killed: " + this.enemiesKilled, leftCol, startY + spacing * 3);
    text("Kills: " + player.kills, leftCol, startY + spacing * 4);
    text("Level: " + player.level, leftCol, startY + spacing * 5);
    text("XP: " + player.xp + " / " + player.xpToNextLevel, leftCol, startY + spacing * 6);
    
    // Section: Stars/Achievements
    fill(255, 200, 0);
    textSize(24);
    textAlign(CENTER);
    text("ACHIEVEMENTS", width / 2, startY + spacing * 8);
    
    let achievementCount = this.getAchievementCount();
    let starY = startY + spacing * 9.5;
    let starSize = 40;
    let starSpacing = 60;
    let startX = width / 2 - starSpacing;
    
    for (let i = 1; i <= 3; i++) {
      let starX = startX + (i - 1) * starSpacing;
      if (i <= achievementCount) {
        fill(255, 215, 0); // Étoile pleine (or)
      } else {
        fill(100); // Étoile vide (gris)
      }
      noStroke();
      this.drawStar(starX, starY, starSize / 2, starSize, 5);
    }
    
    // Section: Player Vehicle Info
    fill(255, 200, 0);
    textSize(24);
    textAlign(LEFT);
    text("PLAYER VEHICLE", leftCol, startY + spacing * 12);
    
    fill(255);
    textSize(18);
    text("Health: " + Math.floor(player.health) + " / " + player.maxHealth, leftCol, startY + spacing * 13);
    text("Speed: " + player.maxSpeed.toFixed(1), leftCol, startY + spacing * 14);
    text("Fire Rate: " + (1 / player.fireRate).toFixed(1) + " shots/sec", leftCol, startY + spacing * 15);
    text("Weapon Damage: " + player.baseProjectileDamage, leftCol, startY + spacing * 16);
    text("Weapon Level: " + player.weaponUpgradeLevel, leftCol, startY + spacing * 17);
    
    // Dessine l'image du joueur
    let playerImage = player.getCurrentImage();
    if (playerImage) {
      imageMode(CENTER);
      let imgSize = 80;
      image(playerImage, rightCol, startY + spacing * 13, imgSize, imgSize);
    }
    
    // Section: Enemy Info
    fill(255, 200, 0);
    textSize(24);
    textAlign(LEFT);
    text("ENEMIES", rightCol, startY);
    
    fill(255);
    textSize(18);
    
    let enemyY = startY + spacing;
    let enemyTypes = [
      { type: 'basic', name: 'Basic Enemy', health: 50, speed: 2, damage: 10 },
      { type: 'fast', name: 'Fast Enemy', health: 30, speed: 3, damage: 10 },
      { type: 'tank', name: 'Tank Enemy', health: 150, speed: 1.5, damage: 10 },
      { type: 'wanderer', name: 'Wanderer Enemy', health: 40, speed: 2, damage: 10 }
    ];
    
    // Plus d'espace entre les ennemis
    let enemySpacing = spacing * 1.8;
    
    for (let i = 0; i < enemyTypes.length; i++) {
      let enemyType = enemyTypes[i];
      let yPos = enemyY + enemySpacing * i;
      
      // Dessine l'image de l'ennemi si disponible
      if (typeof Enemy !== 'undefined') {
        let enemyImage = null;
        if (enemyType.type === 'tank') {
          enemyImage = Enemy.enemy1Image;
        } else {
          enemyImage = Enemy.enemy2Image;
        }
        
        if (enemyImage) {
          imageMode(CENTER);
          image(enemyImage, rightCol - 100, yPos, 40, 40);
        }
      }
      
      text(enemyType.name, rightCol - 50, yPos);
      textSize(14);
      text("HP: " + enemyType.health + " | Speed: " + enemyType.speed + " | DMG: " + enemyType.damage, rightCol - 50, yPos + 15);
      textSize(18);
    }
    
    // Instructions
    fill(200, 200, 255);
    textSize(20);
    textAlign(CENTER);
    text("Press ESC to Resume", width / 2, height - 40);
    
    pop();
  }

  // Dessine l'écran d'achievement
  drawAchievement() {
    push();
    background(0, 220);
    
    fill(255, 215, 0); // Or
    textSize(48);
    textAlign(CENTER);
    text("ACHIEVEMENT UNLOCKED!", width / 2, height / 2 - 100);
    
    fill(255);
    textSize(32);
    text("Level " + this.achievementLevel + " Complete!", width / 2, height / 2 - 30);
    
    // Affiche les étoiles
    let starY = height / 2 + 20;
    let starSize = 40;
    let starSpacing = 60;
    let startX = width / 2 - starSpacing;
    
    for (let i = 1; i <= 3; i++) {
      let starX = startX + (i - 1) * starSpacing;
      if (i <= this.achievementLevel) {
        fill(255, 215, 0); // Étoile pleine (or)
      } else {
        fill(100); // Étoile vide (gris)
      }
      noStroke();
      this.drawStar(starX, starY, starSize / 2, starSize, 5);
    }
    
    fill(255);
    textSize(18);
    text("Press SPACE to Continue", width / 2, height / 2 + 100);
    
    pop();
  }
  
  // Dessine une étoile
  drawStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }

  // Dessine l'écran de game over
  drawGameOver() {
    push();
    
    // Fond semi-transparent
    fill(0, 0, 0, 200);
    noStroke();
    rect(0, 0, width, height);
    
    // Titre GAME OVER
    fill(255, 0, 0);
    textSize(64);
    textAlign(CENTER);
    textStyle(BOLD);
    text("GAME OVER", width / 2, height / 2 - 200);
    textStyle(NORMAL);
    
    // Section des statistiques
    let statsY = height / 2 - 100;
    let statsSpacing = 35;
    
    fill(255);
    textSize(24);
    textAlign(CENTER);
    
    // Statistiques principales
    text("Final Score: " + this.score, width / 2, statsY);
    text("Waves Survived: " + (this.wave - 1), width / 2, statsY + statsSpacing);
    text("Enemies Killed: " + this.enemiesKilled, width / 2, statsY + statsSpacing * 2);
    
    // Section des achievements
    let achievementY = height / 2 + 50;
    textSize(22);
    fill(255, 255, 200);
    text("Achievements:", width / 2, achievementY);
    
    // Affiche les étoiles selon les achievements
    let achievementCount = this.getAchievementCount();
    let starY = achievementY + 50;
    let starSize = 60;
    let starSpacing = 100;
    let startX = width / 2 - (starSpacing * (3 - 1) / 2);
    
    for (let i = 1; i <= 3; i++) {
      let starX = startX + (i - 1) * starSpacing;
      if (i <= achievementCount) {
        fill(255, 215, 0); // Étoile pleine (or)
        stroke(255, 255, 200);
        strokeWeight(2);
      } else {
        fill(80, 80, 80); // Étoile vide (gris foncé)
        stroke(100, 100, 100);
        strokeWeight(1);
      }
      this.drawStar(starX, starY, starSize / 2, starSize, 5);
    }
    
    // Instruction pour redémarrer
    fill(200, 200, 255);
    textSize(20);
    text("Press SPACE to Restart", width / 2, height / 2 + 200);
    
    pop();
  }
}

