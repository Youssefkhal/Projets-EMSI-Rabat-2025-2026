// Sketch principal du jeu Space Shooter
// Utilise p5.js et les comportements de steering

let player;
let enemies = [];
let xpOrbs = [];
let healthOrbs = [];
let obstacles = [];
let gameManager;

// Sliders pour le debug
let debugSlider;
let spawnRateSlider;
let debugLabel;
let spawnLabel;

// Delta time tracking (global pour être accessible dans tous les fichiers)
let lastFrameTime = 0;
var deltaTime = 16.67; // Default 60fps (var pour scope global)

// Texture d'espace (pattern)
let spaceTileSize = 50; // Taille d'une tuile

// Preload : charge les images avant le setup
function preload() {
  Player.loadImage();
  Enemy.loadImages();
  Obstacle.loadImages();
}

function setup() {
  // Canvas prend toute la fenêtre
  createCanvas(windowWidth, windowHeight);
  
  // Initialisation du joueur au centre de l'écran
  player = new Player(width / 2, height / 2);
  
  // Génération d'obstacles
  generateObstacles();
  
  // Initialisation du game manager
  gameManager = new GameManager();
  
  // Sliders de debug
  debugSlider = createSlider(0, 1, 0, 1);
  debugSlider.position(10, height - 60);
  debugSlider.size(100);
  
  debugLabel = createDiv('Debug:');
  debugLabel.position(10, height - 80);
  debugLabel.style('color', 'white');
  debugLabel.style('font-size', '14px');
  
  spawnRateSlider = createSlider(0.1, 5, 2, 0.1);
  spawnRateSlider.position(120, height - 60);
  spawnRateSlider.size(100);
  
  spawnLabel = createDiv('Spawn Rate:');
  spawnLabel.position(120, height - 80);
  spawnLabel.style('color', 'white');
  spawnLabel.style('font-size', '14px');
}

// Génère des obstacles dans l'écran
function generateObstacles() {
  obstacles = [];
  
  // Génère des obstacles aléatoirement dans l'écran
  let numObstacles = 15;
  for (let i = 0; i < numObstacles; i++) {
    let x = random(100, width - 100);
    let y = random(100, height - 100);
    let w = random(40, 120);
    let h = random(40, 120);
    
    // Évite de placer un obstacle sur le joueur au départ
    let distToPlayer = dist(x, y, player.pos.x, player.pos.y);
    if (distToPlayer > 150) {
      obstacles.push(new Obstacle(x, y, w, h));
    }
  }
}

// Gère le redimensionnement de la fenêtre
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Met à jour la position des sliders de debug
  if (debugSlider) {
    debugSlider.position(10, height - 60);
  }
  
  if (debugLabel) {
    debugLabel.position(10, height - 80);
  }
  
  if (spawnRateSlider) {
    spawnRateSlider.position(120, height - 60);
  }
  
  if (spawnLabel) {
    spawnLabel.position(120, height - 80);
  }
}

function draw() {
  // Calcul du deltaTime
  let currentTime = millis();
  deltaTime = currentTime - lastFrameTime;
  lastFrameTime = currentTime;
  if (deltaTime > 100) deltaTime = 16.67; // Cap pour éviter les gros sauts
  
  // Debug mode
  Vehicle.debug = debugSlider.value() === 1;
  if (spawnRateSlider) {
    gameManager.enemySpawnRate = spawnRateSlider.value();
  }
  
  // Gestion des états du jeu
  switch(gameManager.gameState) {
    case 'menu':
      background(0);
      gameManager.drawMenu();
      break;
      
    case 'playing':
      // Affiche l'écran d'achievement si un achievement est débloqué
      if (gameManager.achievementUnlocked) {
        background(0);
        gameManager.drawAchievement();
      } else {
        updateGame();
        drawGame();
      }
      break;
      
    case 'paused':
      // Dessine le jeu en arrière-plan
      drawGame();
      // Dessine l'écran de pause par-dessus
      gameManager.drawPauseScreen(player);
      break;
      
    case 'gameover':
      drawGame();
      gameManager.drawGameOver();
      break;
  }
}

function updateGame() {
  // Ne met pas à jour le jeu si on est en pause
  if (gameManager.gameState === 'paused') {
    return;
  }
  
  // Mise à jour du joueur
  player.update(obstacles);
  
  // Spawn d'ennemis
  if (gameManager.shouldSpawnEnemy()) {
    enemies.push(gameManager.spawnEnemy());
  }
  
  // Mise à jour des ennemis
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    
    if (enemy.isDead()) {
      // Crée une orb d'XP à la position de l'ennemi
      xpOrbs.push(new XPOrb(enemy.pos.x, enemy.pos.y, enemy.xpValue));
      
      // Crée toujours une orb de santé quand un ennemi meurt
      let healthValue = Math.floor(enemy.maxHealth * 0.1); // 10% de la santé max de l'ennemi
      healthOrbs.push(new HealthOrb(enemy.pos.x, enemy.pos.y, healthValue));
      
      gameManager.enemyKilled(enemy);
      player.addKill(); // Ajoute un kill au joueur
      enemies.splice(i, 1);
      continue;
    }
    
    // Mise à jour de l'ennemi (avec obstacles pour collision)
    enemy.update(player, enemies, obstacles);
    
    // Attaque du joueur
    enemy.attack(player);
  }
  
  // Mise à jour des projectiles
  for (let i = player.projectiles.length - 1; i >= 0; i--) {
    let projectile = player.projectiles[i];
    
    if (projectile.isDead()) {
      player.projectiles.splice(i, 1);
      continue;
    }
    
    projectile.update(enemies, obstacles);
  }
  
  // Mise à jour des orbs d'XP
  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    let orb = xpOrbs[i];
    
    if (orb.collected) {
      xpOrbs.splice(i, 1);
      continue;
    }
    
    orb.update(player, obstacles);
  }
  
  // Mise à jour des orbs de santé
  for (let i = healthOrbs.length - 1; i >= 0; i--) {
    let orb = healthOrbs[i];
    
    if (orb.collected) {
      healthOrbs.splice(i, 1);
      continue;
    }
    
    orb.update(player, obstacles);
  }
  
  // Mise à jour des capacités
  for (let ability of player.abilities) {
    ability.update(player);
    ability.checkCollisions(enemies);
  }
  
  // Vérifie la fin de vague
  if (gameManager.isWaveComplete(enemies)) {
    gameManager.nextWave();
  }
  
  // Vérifie les achievements
  gameManager.checkAchievements(player);
  
  // Vérifie la fin de partie
  gameManager.checkGameOver(player);
}

function drawGame() {
  // Dessine le fond avec texture d'espace
  drawSpaceBackground();
  
  // Dessine les obstacles
  for (let obstacle of obstacles) {
    obstacle.show();
  }
  
  // Dessine les orbs d'XP
  for (let orb of xpOrbs) {
    orb.show();
  }
  
  // Dessine les orbs de santé
  for (let orb of healthOrbs) {
    orb.show();
  }
  
  // Dessine les ennemis
  for (let enemy of enemies) {
    enemy.show();
  }
  
  // Dessine les projectiles
  for (let projectile of player.projectiles) {
    projectile.show();
  }
  
  // Dessine le joueur
  player.show();
  
  // Dessine l'UI
  gameManager.drawUI(player);
  
  // Debug : affiche les informations
  if (Vehicle.debug) {
    push();
    fill(255, 100);
    textSize(12);
    textAlign(LEFT);
    text("Enemies: " + enemies.length, width - 150, 30);
    text("Projectiles: " + player.projectiles.length, width - 150, 50);
    text("XP Orbs: " + xpOrbs.length, width - 150, 70);
    text("Health Orbs: " + healthOrbs.length, width - 150, 90);
    text("Obstacles: " + obstacles.length, width - 150, 110);
    text("FPS: " + Math.floor(frameRate()), width - 150, 130);
    pop();
  }
}

// Dessine le fond avec texture d'espace
function drawSpaceBackground() {
  // Couleur de fond sombre (espace)
  background(10, 10, 30);
  
  push();
  noStroke();
  
  // Dessine un pattern de tuiles d'espace pour l'écran
  for (let x = 0; x < width; x += spaceTileSize) {
    for (let y = 0; y < height; y += spaceTileSize) {
      // Variation de couleur pour créer un effet de profondeur
      let noiseValue = noise(x * 0.01, y * 0.01, frameCount * 0.001);
      let brightness = map(noiseValue, 0, 1, 15, 35);
      
      // Dessine des étoiles aléatoires dans chaque tuile
      for (let i = 0; i < 3; i++) {
        let starX = x + random(spaceTileSize);
        let starY = y + random(spaceTileSize);
        let starSize = random(1, 2.5);
        
        // Probabilité d'avoir une étoile plus brillante
        if (random() < 0.1) {
          fill(255, 255, 200, 200);
          circle(starX, starY, starSize * 2);
        } else {
          fill(brightness * 2, brightness * 1.6, brightness * 2.4, 180);
          circle(starX, starY, starSize);
        }
      }
      
      // Ajoute quelques nébuleuses (cercles flous)
      if (random() < 0.02) {
        fill(30, 20, 50, 40);
        let nebulaX = x + random(spaceTileSize);
        let nebulaY = y + random(spaceTileSize);
        let nebulaSize = random(20, 40);
        circle(nebulaX, nebulaY, nebulaSize);
      }
    }
  }
  
  pop();
}

function keyPressed() {
  // Contrôles du jeu
  if (key === ' ') {
    if (gameManager.gameState === 'menu') {
      gameManager.startGame();
    } else if (gameManager.gameState === 'playing') {
      if (gameManager.achievementUnlocked) {
        // Continue après avoir vu l'achievement
        gameManager.achievementUnlocked = false;
      }
    } else if (gameManager.gameState === 'gameover') {
      // Reset du jeu
      player = new Player(width / 2, height / 2);
      enemies = [];
      xpOrbs = [];
      healthOrbs = [];
      obstacles = [];
      generateObstacles();
      gameManager = new GameManager();
      gameManager.startGame();
    }
  }
  
  // Toggle debug
  if (key === 'f' || key === 'F') {
    Vehicle.debug = !Vehicle.debug;
    if (debugSlider) {
      debugSlider.value(Vehicle.debug ? 1 : 0);
    }
  }
  
  // Pause avec ESC
  if (keyCode === ESCAPE) {
    if (gameManager.gameState === 'playing') {
      gameManager.togglePause();
      return false; // Empêche le comportement par défaut (fermer la page)
    } else if (gameManager.gameState === 'paused') {
      gameManager.togglePause();
      return false; // Empêche le comportement par défaut
    }
  }
}

// Gestion du clic de souris
function mousePressed() {
  if (mouseButton === LEFT) {
    // Tir avec le clic gauche
    if (gameManager.gameState === 'playing' && !gameManager.achievementUnlocked && player) {
      player.fire();
    }
  }
}

