# SPACE SHOOTER - Documentation Complète du Projet
Realisé Par Youssef Khallouqi ET Mohamed Wael Addoul
## 📋 Table des Matières



https://github.com/user-attachments/assets/f0fff767-91e7-4efe-b684-d12ed0e6d9db



1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture du Projet](#architecture-du-projet)
3. [Classe Vehicle - Comportements de Steering](#classe-vehicle)
4. [Classe Player - Le Joueur](#classe-player)
5. [Classe Enemy - Les Ennemis](#classe-enemy)
6. [Classe Projectile - Les Projectiles](#classe-projectile)
7. [Classe Obstacle - Les Obstacles](#classe-obstacle)
8. [Classe XPOrb - Orbes d'Expérience](#classe-xporb)
9. [Classe HealthOrb - Orbes de Santé](#classe-healthorb)
10. [Classe Ability - Capacités Spéciales](#classe-ability)
11. [Classe GameManager - Gestion du Jeu](#classe-gamemanager)
12. [Fichier sketch.js - Boucle Principale](#fichier-sketchjs)
13. [Système de Collisions](#système-de-collisions)
14. [Mécaniques de Jeu](#mécaniques-de-jeu)
15. [Contrôles](#contrôles)

---

## Vue d'Ensemble

**Space Shooter** est un jeu de type shoot'em up développé avec p5.js utilisant les comportements de steering (poursuite, évasion, évitement d'obstacles...) pour créer des mouvements fluides et intelligents pour tous les entités du jeu.

### Technologies Utilisées
- **p5.js** : Bibliothèque JavaScript pour le rendu graphique
- **Steering Behaviors** : Algorithmes de mouvement autonome
- **HTML5 Canvas** : Rendu graphique

### Concept Principal
Le joueur contrôle un vaisseau spatial qui suit la souris. Le vaisseau tire des projectiles vers la position de la souris. Des ennemis spawnent progressivement et poursuivent le joueur. Tous les éléments (joueur, ennemis, projectiles, orbes) utilisent l'évitement d'obstacles pour naviguer dans l'environnement.

---

## Architecture du Projet

### Structure des Fichiers

```
DragonOrbitGame/
├── index.html          # Point d'entrée HTML
├── sketch.js           # Boucle principale du jeu
├── vehicle.js          # Classe de base avec comportements de steering
├── player.js           # Classe Player (hérite de Vehicle)
├── enemy.js            # Classe Enemy (hérite de Vehicle)
├── projectile.js       # Classe Projectile (hérite de Vehicle)
├── obstacle.js         # Classe Obstacle (obstacles statiques)
├── xp.js               # Classe XPOrb (hérite de Vehicle)
├── health.js           # Classe HealthOrb (hérite de Vehicle)
├── ability.js          # Classe Ability (capacités spéciales)
├── gameManager.js      # Classe GameManager (gestion du jeu)
├── style.css           # Styles CSS
└── pngs/               # Dossier des images
    ├── shouter.png
    ├── up2.png
    ├── up3.png
    ├── enemy1.gif
    ├── enemy2.gif
    ├── obstacle1.png
    ├── obstacle2.png
    └── obstacle3.png
```

### Hiérarchie des Classes

```
Vehicle (classe de base)
├── Player
├── Enemy
├── Projectile
├── XPOrb
└── HealthOrb

Obstacle (classe indépendante)
Ability (classe indépendante)
GameManager (classe indépendante)
```

---

## Classe Vehicle

### Description
Classe de base abstraite qui implémente tous les comportements de steering. Toutes les entités mobiles du jeu héritent de cette classe.

### Propriétés

```javascript
static debug = false;              // Mode debug global
this.pos = createVector(x, y);    // Position (p5.Vector)
this.vel = createVector(0, 0);     // Vitesse (p5.Vector)
this.acc = createVector(0, 0);     // Accélération (p5.Vector)
this.maxSpeed = 4;                 // Vitesse maximale
this.maxForce = 0.1;               // Force maximale appliquée
this.r = 16;                       // Rayon de collision
this.health = 100;                 // Points de vie actuels
this.maxHealth = 100;              // Points de vie maximum
this.detectionRadius = 200;        // Rayon de détection
```

### Méthodes Principales

#### `constructor(x, y)`
**Logique :**
- Initialise la position à `(x, y)`
- Initialise la vitesse et l'accélération à zéro
- Définit les valeurs par défaut pour la vitesse, la force, le rayon, et la santé

#### `seek(target, arrival = false)`
**Logique détaillée :**
1. Calcule le vecteur désiré : `desiredSpeed = target - pos`
2. Calcule la distance : `distance = magnitude(desiredSpeed)`
3. Si `arrival = true` et `distance < 100` :
   - Utilise le comportement d'arrivée (ralentit près de la cible)
   - Mappe la distance de 0-100 à 0-maxSpeed
   - `desiredSpeedMag = map(distance, 0, 100, 0, maxSpeed)`
4. Sinon, fixe la magnitude à `maxSpeed`
5. Calcule la force de steering : `force = desiredSpeed - vel`
6. Limite la force à `maxForce`
7. Retourne la force

**Formule :** `force = normalize(desired - velocity) * maxSpeed - velocity`

#### `flee(target)`
**Logique :**
- Inverse simplement la force de seek
- `return seek(target).mult(-1)`

#### `pursue(target, predictionFrames = 10)`
**Logique détaillée :**
1. Vérifie si la cible a une vitesse (`target.vel`)
2. Si non, utilise `seek` normal
3. Sinon :
   - Prédit la position future : `prediction = target.vel * predictionFrames + target.pos`
   - Utilise `seek` vers cette position prédite

**Formule :** `futurePosition = currentPosition + velocity * predictionFrames`

#### `evade(target)`
**Logique :**
- Inverse la force de pursue
- `return pursue(target).mult(-1)`

#### `wander()`
**Logique détaillée :**
1. Crée un point devant le véhicule :
   - Normalise la vitesse
   - Multiplie par 50 pixels
   - Ajoute à la position actuelle
2. Génère un point aléatoire sur un cercle :
   - Angle aléatoire : `angle = heading() + random(-PI/4, PI/4)`
   - Rayon du cercle : 30 pixels
   - `wanderPoint += (cos(angle) * radius, sin(angle) * radius)`
3. Utilise `seek` vers ce point

#### `separate(vehicles, desiredSeparation = 50)`
**Logique détaillée :**
1. Initialise un vecteur de répulsion `steer = (0, 0)`
2. Pour chaque véhicule proche :
   - Calcule la distance `d`
   - Si `0 < d < desiredSeparation` :
     - Calcule le vecteur de répulsion : `diff = pos - other.pos`
     - Normalise et divise par la distance (plus proche = plus fort)
     - Ajoute à `steer`
     - Incrémente le compteur
3. Si des voisins sont trouvés :
   - Moyenne le vecteur : `steer /= count`
   - Normalise et multiplie par `maxSpeed`
   - Calcule la force : `steer = steer - vel`
   - Limite à `maxForce`
4. Retourne `steer`

**Formule :** `steer = average(normalize(pos - neighbor.pos) / distance)`

#### `align(vehicles, neighborDist = 100)`
**Logique détaillée :**
1. Initialise `sum = (0, 0)` et `count = 0`
2. Pour chaque voisin dans `neighborDist` :
   - Ajoute la vitesse du voisin à `sum`
   - Incrémente `count`
3. Si des voisins sont trouvés :
   - Moyenne : `sum /= count`
   - Normalise et multiplie par `maxSpeed`
   - Calcule la force : `steer = sum - vel`
   - Limite à `maxForce`
4. Retourne `steer`

#### `cohesion(vehicles, neighborDist = 100)`
**Logique détaillée :**
1. Initialise `sum = (0, 0)` et `count = 0`
2. Pour chaque voisin dans `neighborDist` :
   - Ajoute la position du voisin à `sum`
   - Incrémente `count`
3. Si des voisins sont trouvés :
   - Moyenne : `sum /= count` (centre de masse)
   - Utilise `seek` vers ce centre
4. Retourne la force de seek

#### `avoid(obstacles)` 
**Logique détaillée (évitement d'obstacles avec vecteur ahead) :**

1. **Vérification initiale :**
   - Si pas d'obstacles, retourne `(0, 0)`

2. **Calcul des vecteurs ahead :**
   - `ahead = vel * 30` (point 30 frames devant)
   - `ahead2 = ahead * 0.5` (point plus proche)
   - `pointAuBoutDeAhead = pos + ahead`
   - `pointAuBoutDeAhead2 = pos + ahead2`

3. **Détection de l'obstacle le plus proche :**
   - Appelle `getObstacleLePlusProche(obstacles)`
   - Si aucun obstacle, retourne `(0, 0)`

4. **Calcul du centre de l'obstacle :**
   - Si obstacle circulaire (`o.r` existe) : `center = o.pos`
   - Si obstacle rectangulaire (`o.w` et `o.h` existent) :
     - `center = (pos.x + w/2, pos.y + h/2)`
   - Sinon : `center = o.pos`

5. **Calcul des distances :**
   - `distance1 = dist(pointAuBoutDeAhead, obstacleCenter)`
   - `distance2 = dist(pointAuBoutDeAhead2, obstacleCenter)`
   - `distance = min(distance1, distance2)`

6. **Calcul du rayon effectif de l'obstacle :**
   - Si circulaire : `obstacleRadius = o.r`
   - Si rectangulaire : `obstacleRadius = sqrt(w² + h²) / 2` (demi-diagonale)
   - Sinon : `obstacleRadius = 50` (fallback)

7. **Vérification de collision :**
   - `largeurZoneEvitement = r / 2`
   - Si `distance < obstacleRadius + largeurZoneEvitement + r` :
     - **Collision détectée !**
     - Calcule la force d'évitement :
       - Si `distance1 < distance2` : `force = pointAuBoutDeAhead - obstacleCenter`
       - Sinon : `force = pointAuBoutDeAhead2 - obstacleCenter`
     - Normalise la force : `force.setMag(maxSpeed)`
     - Calcule la force de steering : `force = force - vel`
     - Limite à `maxForce`
     - Retourne la force
   - Sinon : retourne `(0, 0)`

**Formule complète :**
```
if (dist(aheadPoint, obstacleCenter) < obstacleRadius + vehicleRadius + avoidanceWidth) {
  force = normalize(aheadPoint - obstacleCenter) * maxSpeed - velocity
  return limit(force, maxForce)
}
```

#### `getObstacleLePlusProche(obstacles)`
**Logique :**
1. Initialise `plusPetiteDistance = Infinity`
2. Pour chaque obstacle :
   - Calcule le centre (comme dans `avoid`)
   - Calcule la distance : `distance = dist(pos, obstacleCenter)`
   - Si `distance < plusPetiteDistance` :
     - Met à jour `plusPetiteDistance` et `obstacleLePlusProche`
3. Retourne l'obstacle le plus proche

#### `boundaries()`
**Logique détaillée :**
1. Définit une distance de bord `d = 25`
2. Si le véhicule est trop proche d'un bord :
   - **Gauche** (`pos.x < d`) : `desired = (maxSpeed, vel.y)`
   - **Droite** (`pos.x > width - d`) : `desired = (-maxSpeed, vel.y)`
   - **Haut** (`pos.y < d`) : `desired = (vel.x, maxSpeed)`
   - **Bas** (`pos.y > height - d`) : `desired = (vel.x, -maxSpeed)`
3. Si `desired` est défini :
   - Normalise et multiplie par `maxSpeed`
   - Calcule la force : `steer = desired - vel`
   - Limite à `maxForce`
   - Retourne `steer`
4. Sinon retourne `(0, 0)`

#### `flock(vehicles, separationWeight, alignWeight, cohesionWeight)`
**Logique :**
- Combine les trois comportements avec des poids :
  - `sep = separate(vehicles) * separationWeight`
  - `ali = align(vehicles) * alignWeight`
  - `coh = cohesion(vehicles) * cohesionWeight`
- Applique les trois forces

#### `applyForce(force)`
**Logique :**
- Ajoute la force à l'accélération : `acc += force`

#### `update()`
**Logique détaillée (physique) :**
1. Ajoute l'accélération à la vitesse : `vel += acc`
2. Limite la vitesse : `vel.limit(maxSpeed)`
3. Ajoute la vitesse à la position : `pos += vel`
4. Remet l'accélération à zéro : `acc = (0, 0)`

**Formule :** `position(t+1) = position(t) + velocity(t) + acceleration(t)`

#### `isDead()`
**Logique :**
- Retourne `health <= 0`

#### `takeDamage(amount)`
**Logique :**
- `health -= amount`
- Si `health < 0`, fixe à `0`

#### `heal(amount)`
**Logique :**
- `health += amount`
- Si `health > maxHealth`, fixe à `maxHealth`

#### `collidesWith(other)`
**Logique :**
- Calcule la distance : `d = dist(pos, other.pos)`
- Retourne `d < (r + other.r)`

#### `collidesWithPoint(point, radius = 0)`
**Logique :**
- Calcule la distance : `d = dist(pos, point)`
- Retourne `d < (r + radius)`

#### `edges()`
**Logique (wrap-around) :**
- Si le véhicule sort de l'écran, le fait réapparaître de l'autre côté :
  - `pos.x > width + r` → `pos.x = -r`
  - `pos.x < -r` → `pos.x = width + r`
  - `pos.y > height + r` → `pos.y = -r`
  - `pos.y < -r` → `pos.y = height + r`

#### `show()`
**Logique (méthode de base) :**
- Dessine un triangle blanc orienté selon la direction de la vitesse
- Utilise `translate` et `rotate` pour l'orientation

---

## Classe Player

### Description
Représente le joueur contrôlé par la souris. Le vaisseau suit la souris et tire des projectiles.

### Propriétés Additionnelles

```javascript
static shooterImage = null;        // Image de base
static up2Image = null;            // Image niveau 2 (5 kills)
static up3Image = null;            // Image niveau 3 (10 kills)
this.maxSpeed = 5;                 // Vitesse plus élevée que Vehicle
this.maxForce = 0.2;               // Force plus élevée
this.r = 20;                       // Rayon plus grand
this.fireRate = 0.5;               // Secondes entre chaque tir
this.lastFireTime = 0;             // Temps du dernier tir
this.projectiles = [];             // Liste des projectiles actifs
this.level = 1;                    // Niveau du joueur
this.xp = 0;                       // Expérience actuelle
this.xpToNextLevel = 10;          // XP nécessaire pour level up
this.abilities = [];               // Capacités spéciales
this.kills = 0;                    // Nombre de kills
this.weaponUpgradeLevel = 0;       // Niveau de l'arme
this.baseProjectileDamage = 20;   // Dégâts de base
this.lastMousePos = createVector(0, 0);  // Position précédente de la souris
this.mouseMoveThreshold = 2;      // Seuil de mouvement (pixels)
this.mouseStopped = false;         // Si la souris est arrêtée
```

### Méthodes Principales

#### `constructor(x, y)`
**Logique :**
- Appelle `super(x, y)` pour initialiser Vehicle
- Définit les valeurs spécifiques au joueur
- Initialise les systèmes de tir, XP, et kills

#### `upgradeWeapon()`
**Logique :**
- Incrémente `weaponUpgradeLevel`
- Augmente `baseProjectileDamage` de 15
- Affiche un message dans la console

#### `addKill()`
**Logique :**
- Incrémente `kills`
- Si `kills % 10 === 0`, appelle `upgradeWeapon()`

#### `getCurrentImage()`
**Logique :**
- Si `kills >= 10` : retourne `up3Image`
- Sinon si `kills >= 5` : retourne `up2Image`
- Sinon : retourne `shooterImage`

#### `static loadImage()`
**Logique :**
- Charge les trois images du joueur depuis le dossier `pngs/`

#### `update(obstacles = [])` ⭐ **MÉTHODE COMPLEXE**
**Logique détaillée :**

1. **Détection du mouvement de la souris :**
   - `mousePos = (mouseX, mouseY)`
   - `mouseMovement = dist(mousePos, lastMousePos)`
   - Si `mouseMovement < threshold` : `mouseStopped = true`
   - Sinon : `mouseStopped = false`

2. **Calcul de la force de suivi :**
   - Si `mouseStopped` : utilise `seek(mousePos, true)` (arrival)
   - Sinon : utilise `seek(mousePos, false)` (seek normal)
   - Multiplie par `0.2` (force faible pour mouvement fluide)
   - Applique la force

3. **Évitement d'obstacles :**
   - `avoidForce = avoid(obstacles)`
   - Multiplie par `3` (force forte)
   - Applique la force

4. **Boundaries :**
   - `boundariesForce = boundaries()`
   - Multiplie par `3`
   - Applique la force

5. **Mise à jour de la position :**
   - Sauvegarde `prevPos = pos.copy()`
   - Appelle `super.update()`

6. **Collision avec obstacles (backup) :**
   - Pour chaque obstacle :
     - Si `collidesWithCircle(pos, r)` :
       - Restaure `pos = prevPos`
       - Réduit la vitesse : `vel *= 0.3`
       - Break

7. **Limites de l'écran :**
   - `pos.x = constrain(pos.x, r, width - r)`
   - `pos.y = constrain(pos.y, r, height - r)`
   - (Pas de wrap-around pour le joueur)

8. **Mise à jour des capacités :**
   - Pour chaque `ability` : `ability.update(this)`

9. **Mise à jour de la position de la souris :**
   - `lastMousePos = mousePos.copy()`

#### `fire()`
**Logique détaillée :**
1. Calcule le temps actuel : `currentTime = millis() / 1000`
2. Vérifie le cooldown : `if (currentTime - lastFireTime >= fireRate)`
3. Calcule la direction :
   - `mousePos = (mouseX, mouseY)`
   - `direction = mousePos - pos`
   - Normalise `direction`
4. Crée un nouveau projectile :
   - Position : `(pos.x, pos.y)` (centre du vaisseau)
   - Direction : `direction` (normalisée)
   - Owner : `this`
   - Damage : `baseProjectileDamage`
   - Target : `mousePos` (position de la souris au moment du tir)
5. Ajoute le projectile à `projectiles[]`
6. Met à jour `lastFireTime = currentTime`

#### `addXP(amount)`
**Logique :**
1. `xp += amount`
2. Tant que `xp >= xpToNextLevel` :
   - `xp -= xpToNextLevel`
   - Appelle `levelUp()`

#### `levelUp()`
**Logique détaillée :**
1. Incrémente `level`
2. Augmente `xpToNextLevel` : `xpToNextLevel = floor(xpToNextLevel * 1.5)`
3. Améliore les stats :
   - `maxSpeed += 0.2`
   - `fireRate *= 0.95` (tir plus rapide)
   - `maxHealth += 10`
   - `heal(20)` (restaure 20 HP)
4. Affiche un message dans la console

#### `show()`
**Logique détaillée :**
1. Dessine un cercle de santé (rouge, contour)
2. Dessine une barre de santé (rouge/vert selon pourcentage)
3. Translate vers `(pos.x, pos.y)`
4. Calcule l'orientation vers la souris :
   - `direction = mousePos - pos`
   - `rotate(direction.heading() + PI/2)`
5. Dessine l'image actuelle (selon `getCurrentImage()`)
6. Si pas d'image, dessine un triangle bleu (fallback)
7. Dessine les capacités : `for (ability of abilities) ability.show()`

---

## Classe Enemy

### Description
Représente les ennemis avec différents types et comportements.

### Types d'Ennemis

#### Basic Enemy
- `maxSpeed = 2`
- `maxForce = 0.1`
- `r = 18`
- `health = 50`
- `detectionRadius = 250`
- **Comportement :** Pursue si proche, wander sinon

#### Fast Enemy
- `maxSpeed = 3`
- `maxForce = 0.15`
- `r = 12`
- `health = 30`
- `detectionRadius = 300`
- **Comportement :** Pursue agressif avec `predictionFrames = 15`

#### Tank Enemy
- `maxSpeed = 1.5`
- `maxForce = 0.08`
- `r = 30`
- `health = 150`
- `detectionRadius = 400`
- **Comportement :** Pursue lent avec `predictionFrames = 20`
- **Spécial :** Rotation continue dans `show()`

#### Wanderer Enemy
- `maxSpeed = 2`
- `maxForce = 0.1`
- `r = 15`
- `health = 40`
- `detectionRadius = 200`
- **Comportement :** Wander principalement, pursue si très proche (`< detectionRadius * 0.5`)

### Propriétés Additionnelles

```javascript
static enemy1Image = null;         // Image pour tanks
static enemy2Image = null;         // Image pour autres
this.type = 'basic';               // Type d'ennemi
this.behaviorState = 'wander';    // État actuel
this.wanderAngle = random(TWO_PI); // Angle pour wander
this.wanderChange = 0.3;           // Variation d'angle
this.xpValue = 5;                  // XP donnée à la mort
this.damage = 10;                  // Dégâts infligés
this.attackCooldown = 0;           // Cooldown d'attaque
this.attackRate = 1.5;             // Taux d'attaque (secondes)
```

### Méthodes Principales

#### `constructor(x, y, type = 'basic')`
**Logique :**
1. Appelle `super(x, y)`
2. Définit `this.type = type`
3. Selon le type, configure les stats (switch case)
4. Initialise les propriétés de comportement

#### `applyBehaviors(player, enemies)`
**Logique détaillée :**
1. Calcule `distanceToPlayer = dist(pos, player.pos)`
2. Selon le type :
   - **Basic :**
     - Si `distance < detectionRadius` : `force = pursue(player)`, `state = 'pursue'`
     - Sinon : `force = wander()`, `state = 'wander'`
   - **Fast :**
     - Si `distance < detectionRadius` : `force = pursue(player, 15)`, `state = 'pursue'`
     - Sinon : `force = wander()`, `state = 'wander'`
   - **Tank :**
     - Si `distance < detectionRadius` : `force = pursue(player, 20)`, `state = 'pursue'`
     - Sinon : `force = wander()`, `state = 'wander'`
   - **Wanderer :**
     - Si `distance < detectionRadius * 0.5` : `force = pursue(player)`, `state = 'pursue'`
     - Sinon : `force = wander()`, `state = 'wander'`
3. Séparation avec autres ennemis :
   - `separation = separate(enemies, r * 3)`
   - `force += separation * 0.5`
4. Applique la force : `applyForce(force)`

#### `wander()`
**Logique améliorée :**
1. Crée un point devant :
   - Si `vel.mag() < 0.1` : utilise `wanderAngle` directement
   - Sinon : normalise `vel` et multiplie par 50
   - Ajoute à `pos`
2. Variation de l'angle :
   - `wanderAngle += random(-wanderChange, wanderChange)`
3. Point sur le cercle :
   - `wanderPoint += (cos(wanderAngle) * 30, sin(wanderAngle) * 30)`
4. Retourne `seek(wanderPoint)`

#### `update(player, enemies, obstacles = [])`
**Logique détaillée :**
1. Applique les comportements : `applyBehaviors(player, enemies)`
2. Évitement d'obstacles :
   - `avoidForce = avoid(obstacles) * 3`
   - Applique la force
3. Boundaries :
   - `boundariesForce = boundaries() * 3`
   - Applique la force
4. Sauvegarde `prevPos`
5. Appelle `super.update()`
6. Collision avec obstacles (backup) :
   - Si collision : restaure `prevPos`, réduit `vel *= 0.3`
7. Wrap-around : `edges()`
8. Mise à jour du cooldown :
   - `attackCooldown -= deltaTime / 1000`

#### `attack(player)`
**Logique :**
1. Si `collidesWith(player)` et `attackCooldown <= 0` :
   - `player.takeDamage(damage)`
   - `attackCooldown = attackRate`
   - Retourne `true`
2. Sinon retourne `false`

#### `show()`
**Logique détaillée :**
1. Si debug et `state === 'pursue'` : dessine le cercle de détection
2. Dessine la barre de santé
3. Translate vers `(pos.x, pos.y)`
4. Rotation :
   - Si `type === 'tank'` : `rotate(millis() * 0.001)` (rotation continue)
   - Sinon : `rotate(vel.heading())` (orientation selon mouvement)
5. Sélection de l'image selon le type
6. Dessine l'image ou la forme par défaut

---

## Classe Projectile

### Description
Projectiles tirés par le joueur vers la position de la souris.

### Propriétés

```javascript
this.owner = owner;                // Référence au joueur
this.vel = direction * 10;         // Vitesse initiale forte
this.maxSpeed = 10;                 // Vitesse maximale
this.r = 5;                         // Rayon petit
this.damage = damage;               // Dégâts
this.lifetime = 2;                  // Durée de vie (secondes)
this.age = 0;                       // Âge actuel
this.targetPos = targetPos;        // Position cible (souris)
```

### Méthodes Principales

#### `constructor(x, y, direction, owner, damage, targetPos)`
**Logique :**
1. Appelle `super(x, y)`
2. Définit `owner = owner`
3. Vitesse initiale : `vel = direction * 10`
4. Configure les propriétés spécifiques

#### `update(enemies, obstacles = [])`
**Logique détaillée :**
1. Si `targetPos` existe :
   - `seekForce = seek(targetPos)`
   - `seekStrength = min(0.5, age * 0.5)` (augmente avec l'âge)
   - Applique `seekForce * seekStrength`
2. Évitement d'obstacles (léger) :
   - `avoidForce = avoid(obstacles) * 1.5`
   - Applique la force
3. Appelle `super.update()`
4. Collision avec obstacles :
   - Si collision : `health = 0` (détruit le projectile)
5. Collision avec ennemis :
   - Pour chaque ennemi non mort :
     - Si `collidesWith(enemy)` :
       - `enemy.takeDamage(damage)`
       - `health = 0` (détruit le projectile)
6. Mise à jour de l'âge :
   - `age += deltaTime / 1000`
   - Si `age >= lifetime` : `health = 0`
7. Wrap-around : `edges()`

#### `show()`
**Logique :**
1. Dessine un cercle jaune
2. Si `targetPos` existe : dessine une ligne vers la cible (debug)

---

## Classe Obstacle

### Description
Obstacles statiques rectangulaires que les entités doivent éviter.

### Propriétés

```javascript
static obstacle1Image = null;
static obstacle2Image = null;
static obstacle3Image = null;
this.pos = createVector(x, y);     // Coin supérieur gauche
this.w = w;                         // Largeur
this.h = h;                         // Hauteur
this.image = null;                  // Image choisie aléatoirement
```

### Méthodes Principales

#### `constructor(x, y, w, h)`
**Logique :**
1. Définit `pos = (x, y)` (coin supérieur gauche)
2. Définit `w` et `h`
3. Choisit aléatoirement une image (1, 2, ou 3)

#### `containsPoint(x, y)`
**Logique :**
- Retourne `x >= pos.x && x <= pos.x + w && y >= pos.y && y <= pos.y + h`

#### `collidesWithCircle(circlePos, circleRadius)` ⭐ **IMPORTANT**
**Logique détaillée :**
1. Trouve le point le plus proche sur l'obstacle :
   - `closestX = constrain(circlePos.x, pos.x, pos.x + w)`
   - `closestY = constrain(circlePos.y, pos.y, pos.y + h)`
2. Calcule la distance :
   - `distance = dist(circlePos, (closestX, closestY))`
3. Retourne `distance < circleRadius`

**Formule :** Trouve le point sur le rectangle le plus proche du cercle, puis vérifie si la distance est inférieure au rayon.

#### `show()`
**Logique :**
- Si image chargée : dessine l'image
- Sinon : dessine un rectangle marron (fallback)

---

## Classe XPOrb

### Description
Orbes d'expérience attirées par le joueur.

### Propriétés

```javascript
this.xpValue = value;               // Valeur d'XP
this.r = 8;                         // Rayon petit
this.maxSpeed = 3;                  // Vitesse modérée
this.maxForce = 0.15;               // Force modérée
this.vel = random2D() * 2;          // Vitesse initiale aléatoire
this.attractionRadius = 100;        // Rayon d'attraction
this.collected = false;             // Si collectée
```

### Méthodes Principales

#### `update(player, obstacles = [])`
**Logique détaillée :**
1. Calcule `distanceToPlayer = dist(pos, player.pos)`
2. Si `distance < attractionRadius` :
   - `seekForce = seek(player.pos, true)` (arrival)
   - Applique `seekForce * 0.2`
3. Évitement d'obstacles :
   - `avoidForce = avoid(obstacles) * 2`
   - Applique la force
4. Appelle `super.update()`
5. Si `collidesWith(player)` :
   - `collected = true`
   - `player.addXP(xpValue)`
6. Wrap-around : `edges()`

#### `show()`
**Logique :**
- Dessine un cercle cyan
- Effet de brillance (cercle blanc semi-transparent)

---

## Classe HealthOrb

### Description
Orbes de santé attirées par le joueur.

### Propriétés

```javascript
this.healthValue = value;           // Valeur de santé
this.r = 10;                        // Rayon moyen
// ... (similaire à XPOrb)
```

### Méthodes Principales

#### `update(player, obstacles = [])`
**Logique :** Identique à XPOrb mais appelle `player.heal(healthValue)` au lieu de `addXP()`

#### `show()`
**Logique :**
- Dessine un cercle rouge
- Effet de brillance
- Croix blanche au centre (symbole médical)

---

## Classe Ability

### Description
Capacités spéciales du joueur (orbital, AOE).

### Types

#### Orbital
- Arme qui tourne autour du joueur
- `orbitalRadius = 60`
- `orbitalSpeed = 0.1`
- `damage = 15`
- `cooldown = 0.3`

#### AOE
- Zone de dégâts périodique
- `radius = 80`
- `damage = 30`
- `cooldown = 2`

### Méthodes Principales

#### `getOrbitalPosition()`
**Logique :**
- `x = player.pos.x + cos(angle) * orbitalRadius`
- `y = player.pos.y + sin(angle) * orbitalRadius`
- Retourne `(x, y)`

#### `checkCollisions(enemies)`
**Logique :**
1. Si `type !== 'orbital'`, retourne
2. Pour chaque ennemi :
   - Si `collidesWithPoint(orbitalPos, player.r)` et cooldown écoulé :
     - `enemy.takeDamage(damage)`
     - Met à jour `lastHitTime[enemy]`

#### `show()`
**Logique :**
- **Orbital :** Dessine un cercle jaune à `getOrbitalPosition()`
- **AOE :** Dessine un cercle pulsant autour du joueur

---

## Classe GameManager

### Description
Gère l'état du jeu, les vagues, le spawn, les achievements, etc.

### Propriétés

```javascript
this.gameState = 'menu';            // 'menu', 'playing', 'paused', 'gameover'
this.wave = 1;                      // Vague actuelle
this.enemiesPerWave = 20;           // Ennemis par vague
this.enemySpawnRate = 1.5;          // Secondes entre spawns
this.lastSpawnTime = 0;             // Temps du dernier spawn
this.enemiesSpawnedThisWave = 0;    // Compteur de spawns
this.enemyTypes = [...];            // Types avec poids
this.waveDuration = 30;             // Durée de vague (secondes)
this.waveStartTime = 0;             // Début de vague
this.score = 0;                     // Score
this.enemiesKilled = 0;             // Ennemis tués
this.achievements = {...};          // Achievements débloqués
this.achievementUnlocked = false;   // Si un achievement vient d'être débloqué
this.achievementLevel = 0;          // Niveau d'achievement
this.enemyDamageMultiplier = 1.0;   // Multiplicateur de dégâts
```

### Méthodes Principales

#### `startGame()`
**Logique :**
- Réinitialise toutes les variables
- `gameState = 'playing'`
- `wave = 1`
- `enemiesPerWave = 5` (démarrage)
- `waveStartTime = millis() / 1000`

#### `checkAchievements(player)`
**Logique détaillée :**
1. **Level 1 (10 kills) :**
   - Si `!achievements.level1 && player.kills >= 10` :
     - Débloque level1
     - `achievementLevel = 1`
     - `achievementUnlocked = true`
     - `enemyDamageMultiplier = 1.2` (20% plus de dégâts)
2. **Level 2 (25 kills) :**
   - Si `!achievements.level2 && player.kills >= 25` :
     - Débloque level2
     - `achievementLevel = 2`
     - `enemyDamageMultiplier = 1.5` (50% plus de dégâts)
3. **Level 3 (50 kills) :**
   - Si `!achievements.level3 && player.kills >= 50` :
     - Débloque level3
     - `achievementLevel = 3`
     - `enemyDamageMultiplier = 2.0` (100% plus de dégâts)

#### `getRandomEnemyType()`
**Logique (système de poids) :**
1. Calcule `totalWeight = sum(weights)`
2. Génère `random = Math.random() * totalWeight`
3. Parcourt les types :
   - `currentWeight += type.weight`
   - Si `random <= currentWeight` : retourne ce type
4. Retourne 'basic' par défaut

**Exemple :** Si weights = [50, 25, 15, 10], total = 100. Si random = 60 :
- currentWeight = 50 (basic), 60 > 50, continue
- currentWeight = 75 (fast), 60 <= 75, retourne 'fast'

#### `spawnEnemy()`
**Logique détaillée :**
1. Choisit un côté aléatoire (0-3) :
   - 0 = Haut : `(random(width), -20)`
   - 1 = Droite : `(width + 20, random(height))`
   - 2 = Bas : `(random(width), height + 20)`
   - 3 = Gauche : `(-20, random(height))`
2. Obtient un type aléatoire : `type = getRandomEnemyType()`
3. Crée l'ennemi : `enemy = new Enemy(x, y, type)`
4. Applique le multiplicateur : `enemy.damage = floor(enemy.damage * enemyDamageMultiplier)`
5. Retourne l'ennemi

#### `shouldSpawnEnemy()`
**Logique :**
1. Si `gameState !== 'playing'`, retourne `false`
2. `currentTime = millis() / 1000`
3. Si `currentTime - lastSpawnTime >= enemySpawnRate` ET `enemiesSpawnedThisWave < enemiesPerWave` :
   - `lastSpawnTime = currentTime`
   - `enemiesSpawnedThisWave++`
   - Retourne `true`
4. Sinon retourne `false`

#### `isWaveComplete(enemies)`
**Logique :**
1. `aliveEnemies = enemies.filter(e => !e.isDead()).length`
2. `currentTime = millis() / 1000`
3. `waveTime = currentTime - waveStartTime`
4. Retourne `aliveEnemies === 0 && enemiesSpawnedThisWave >= enemiesPerWave && waveTime >= waveDuration`

#### `nextWave()`
**Logique détaillée :**
1. `wave++`
2. `enemiesPerWave = floor(20 + wave * 5)` (augmente avec la vague)
3. Réinitialise les compteurs
4. `waveStartTime = millis() / 1000`
5. `enemySpawnRate = max(0.5, 1.5 - wave * 0.05)` (spawn plus rapide)
6. Augmente les poids des ennemis difficiles :
   - Pour chaque type 'tank' ou 'fast' : `weight += 2`

#### `togglePause()`
**Logique :**
- Si `gameState === 'playing'` : `gameState = 'paused'`, `isPaused = true`
- Si `gameState === 'paused'` : `gameState = 'playing'`, `isPaused = false`

#### `drawPauseScreen(player)`
**Logique détaillée :**
1. Dessine un fond semi-transparent
2. Affiche "PAUSED"
3. **Section Game Info :** Wave, Score, Kills, Level, XP
4. **Section Achievements :** Affiche 3 étoiles (pleines si débloquées)
5. **Section Player Vehicle :** Health, Speed, Fire Rate, Damage, Level + image
6. **Section Enemies :** Liste tous les types avec images et stats
7. Instructions : "Press ESC to Resume"

---

## Fichier sketch.js

### Variables Globales

```javascript
let player;                         // Instance du joueur
let enemies = [];                  // Liste des ennemis
let xpOrbs = [];                   // Liste des orbes d'XP
let healthOrbs = [];               // Liste des orbes de santé
let obstacles = [];                 // Liste des obstacles
let gameManager;                    // Instance du GameManager
let debugSlider;                    // Slider pour debug
let spawnRateSlider;               // Slider pour spawn rate
let lastFrameTime = 0;             // Temps de la dernière frame
var deltaTime = 16.67;             // Delta time (ms)
let spaceTileSize = 50;            // Taille des tuiles d'espace
```

### Fonctions Principales

#### `preload()`
**Logique :**
- Charge toutes les images avant le setup
- `Player.loadImage()`
- `Enemy.loadImages()`
- `Obstacle.loadImages()`

#### `setup()`
**Logique détaillée :**
1. Crée le canvas : `createCanvas(windowWidth, windowHeight)`
2. Initialise le joueur : `player = new Player(width/2, height/2)`
3. Génère les obstacles : `generateObstacles()`
4. Initialise le GameManager : `gameManager = new GameManager()`
5. Crée les sliders de debug

#### `generateObstacles()`
**Logique :**
1. Réinitialise `obstacles = []`
2. Pour `i = 0` à `15` :
   - Génère `x = random(100, width - 100)`
   - Génère `y = random(100, height - 100)`
   - Génère `w = random(40, 120)`
   - Génère `h = random(40, 120)`
   - Si `dist(x, y, player.pos) > 150` :
     - `obstacles.push(new Obstacle(x, y, w, h))`

#### `draw()`
**Logique détaillée :**
1. Calcule `deltaTime = currentTime - lastFrameTime`
2. Si `deltaTime > 100`, fixe à `16.67` (cap)
3. Met à jour le mode debug depuis le slider
4. Met à jour `enemySpawnRate` depuis le slider
5. Selon `gameState` :
   - **'menu'** : `drawMenu()`
   - **'playing'** :
     - Si `achievementUnlocked` : `drawAchievement()`
     - Sinon : `updateGame()`, `drawGame()`
   - **'paused'** : `drawGame()`, `drawPauseScreen()`
   - **'gameover'** : `drawGame()`, `drawGameOver()`

#### `updateGame()`
**Logique détaillée :**
1. Si `gameState === 'paused'`, retourne
2. **Mise à jour du joueur :** `player.update(obstacles)`
3. **Spawn d'ennemis :**
   - Si `shouldSpawnEnemy()` : `enemies.push(spawnEnemy())`
4. **Mise à jour des ennemis :**
   - Pour chaque ennemi (boucle inverse) :
     - Si `isDead()` :
       - Crée `XPOrb` à la position
       - Crée `HealthOrb` (10% de maxHealth)
       - `enemyKilled()`, `player.addKill()`
       - Supprime de la liste
     - Sinon : `enemy.update(player, enemies, obstacles)`, `enemy.attack(player)`
5. **Mise à jour des projectiles :**
   - Pour chaque projectile (boucle inverse) :
     - Si `isDead()` : supprime
     - Sinon : `projectile.update(enemies, obstacles)`
6. **Mise à jour des orbes d'XP :**
   - Pour chaque orb (boucle inverse) :
     - Si `collected` : supprime
     - Sinon : `orb.update(player, obstacles)`
7. **Mise à jour des orbes de santé :** (identique)
8. **Mise à jour des capacités :**
   - Pour chaque `ability` : `update(player)`, `checkCollisions(enemies)`
9. **Vérifications :**
   - Si `isWaveComplete()` : `nextWave()`
   - `checkAchievements(player)`
   - `checkGameOver(player)`

#### `drawGame()`
**Logique :**
1. `drawSpaceBackground()`
2. Dessine les obstacles
3. Dessine les orbes d'XP
4. Dessine les orbes de santé
5. Dessine les ennemis
6. Dessine les projectiles
7. Dessine le joueur
8. `drawUI(player)`
9. Si debug : affiche les compteurs (Enemies, Projectiles, etc.)

#### `drawSpaceBackground()`
**Logique détaillée :**
1. Fond sombre : `background(10, 10, 30)`
2. Pour chaque tuile (`x = 0` à `width`, `y = 0` à `height`, pas de `spaceTileSize`) :
   - Calcule `brightness` avec `noise()`
   - Dessine 3 étoiles aléatoires dans la tuile
   - 10% de chance d'étoile brillante
   - 2% de chance de nébuleuse (cercle flou)

#### `keyPressed()`
**Logique :**
- **SPACE :**
  - Menu → `startGame()`
  - Playing + achievement → continue
  - Gameover → reset complet
- **F :** Toggle debug
- **ESC :** Toggle pause

#### `mousePressed()`
**Logique :**
- **Clic gauche :** Si playing et pas d'achievement : `player.fire()`

---

## Système de Collisions

### Collision Cercle-Cercle
**Formule :** `dist(pos1, pos2) < (r1 + r2)`

### Collision Cercle-Rectangle
**Algorithme :**
1. Trouve le point le plus proche sur le rectangle
2. Calcule la distance entre ce point et le centre du cercle
3. Si `distance < radius` : collision

### Collision Point-Cercle
**Formule :** `dist(point, circlePos) < (circleRadius + pointRadius)`

---

## Mécaniques de Jeu

### Système de Niveaux
- Gain d'XP en collectant des orbes
- Level up quand `xp >= xpToNextLevel`
- `xpToNextLevel` augmente de 50% à chaque level
- Améliorations automatiques : speed, fire rate, health

### Système de Kills
- Chaque kill incrémente `player.kills`
- Tous les 10 kills : amélioration d'arme (+15 dégâts)
- Changement d'image à 5 et 10 kills

### Système de Vagues
- Vague 1 : 5 ennemis
- Vague N : `20 + N * 5` ennemis
- Spawn rate diminue avec les vagues
- Poids des ennemis difficiles augmente

### Système d'Achievements
- 10 kills : Level 1 (ennemis +20% dégâts)
- 25 kills : Level 2 (ennemis +50% dégâts)
- 50 kills : Level 3 (ennemis +100% dégâts)

---

## Contrôles

- **Souris** : Déplacement du vaisseau (suit la souris)
- **Clic Gauche** : Tirer
- **ESC** : Pause/Reprendre
- **SPACE** : Démarrer/Redémarrer
- **F** : Toggle debug mode
- **Sliders** : Ajuster spawn rate et debug

---

## Conclusion

Ce projet implémente un système complet de steering behaviors avec évitement d'obstacles pour créer un gameplay fluide et intelligent. Toutes les entités utilisent les mêmes algorithmes de base mais avec des paramètres différents selon leur rôle.

**Points Clés :**
- Architecture orientée objet avec héritage
- Système de steering behaviors modulaire
- Évitement d'obstacles sophistiqué
- Gestion d'état du jeu complète
- Système de progression (XP, levels, upgrades)

**Améliorations Possibles :**
- Système de choix d'améliorations au level up
- Plus de types d'ennemis et de capacités
- Boss fights
- Système de sauvegarde
- Effets sonores et musique

