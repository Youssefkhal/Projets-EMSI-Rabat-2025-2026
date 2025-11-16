// Classe de base Vehicle avec tous les comportements de steering
// Utilisée par le joueur, les ennemis, les projectiles, etc.
class Vehicle {
  static debug = false;

  constructor(x, y) {
    // position du véhicule
    this.pos = createVector(x, y);
    // vitesse du véhicule
    this.vel = createVector(0, 0);
    // accélération du véhicule
    this.acc = createVector(0, 0);
    // vitesse maximale du véhicule
    this.maxSpeed = 4;
    // force maximale appliquée au véhicule
    this.maxForce = 0.1;
    // rayon du véhicule
    this.r = 16;
    // santé du véhicule
    this.health = 100;
    this.maxHealth = 100;
    // rayon de détection pour certains comportements
    this.detectionRadius = 200;
  }

  // SEEK : se diriger vers une cible
  seek(target, arrival = false) {
    let desiredSpeed = p5.Vector.sub(target, this.pos);
    let distance = desiredSpeed.mag();
    
    if (arrival && distance < 100) {
      // Arrival behavior : ralentir près de la cible
      let desiredSpeedMag = map(distance, 0, 100, 0, this.maxSpeed);
      desiredSpeed.setMag(desiredSpeedMag);
    } else {
      desiredSpeed.setMag(this.maxSpeed);
    }

    let force = p5.Vector.sub(desiredSpeed, this.vel);
    force.limit(this.maxForce);
    return force;
  }

  // FLEE : fuir une cible
  flee(target) {
    return this.seek(target).mult(-1);
  }

  // PURSUE : poursuivre une cible en mouvement (prédiction)
  pursue(target, predictionFrames = 10) {
    if (!target.vel) {
      return this.seek(target.pos || target);
    }
    
    // Prédiction de la position future
    let prediction = target.vel.copy();
    prediction.mult(predictionFrames);
    prediction.add(target.pos);
    
    return this.seek(prediction);
  }

  // EVADE : s'évader d'une cible en mouvement
  evade(target) {
    return this.pursue(target).mult(-1);
  }

  // WANDER : mouvement aléatoire
  wander() {
    // Cercle devant le véhicule
    let wanderPoint = this.vel.copy();
    wanderPoint.normalize();
    wanderPoint.mult(50);
    wanderPoint.add(this.pos);

    // Point aléatoire sur le cercle
    let wanderRadius = 30;
    let angle = this.vel.heading() + random(-PI/4, PI/4);
    wanderPoint.x += cos(angle) * wanderRadius;
    wanderPoint.y += sin(angle) * wanderRadius;

    return this.seek(wanderPoint);
  }

  // SEPARATION : éviter les autres véhicules proches
  separate(vehicles, desiredSeparation = 50) {
    let steer = createVector(0, 0);
    let count = 0;

    for (let other of vehicles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < desiredSeparation) {
        // Calculer le vecteur de répulsion
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d); // Plus proche = plus fort
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.vel);
      steer.limit(this.maxForce);
    }

    return steer;
  }

  // ALIGN : s'aligner avec les voisins
  align(vehicles, neighborDist = 100) {
    let sum = createVector(0, 0);
    let count = 0;

    for (let other of vehicles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.vel);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxSpeed);
      let steer = p5.Vector.sub(sum, this.vel);
      steer.limit(this.maxForce);
      return steer;
    }

    return createVector(0, 0);
  }

  // COHESION : se rapprocher des voisins
  cohesion(vehicles, neighborDist = 100) {
    let sum = createVector(0, 0);
    let count = 0;

    for (let other of vehicles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.pos);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    }

    return createVector(0, 0);
  }

  /**
   * OBSTACLE AVOIDANCE : évite les obstacles en utilisant un vecteur ahead
   * 
   * ALGORITHME :
   * 1. Calcule deux points "ahead" devant le véhicule (un proche, un loin)
   * 2. Trouve l'obstacle le plus proche
   * 3. Calcule le centre de l'obstacle (gère rectangles et cercles)
   * 4. Vérifie si une collision est imminente
   * 5. Si oui, calcule une force d'évitement perpendiculaire à l'obstacle
   * 
   * @param {Array} obstacles - Liste des obstacles à éviter
   * @returns {p5.Vector} Force d'évitement (ou vecteur nul si pas de collision)
   */
  avoid(obstacles) {
    // Vérification initiale : pas d'obstacles = pas de force
    if (!obstacles || obstacles.length === 0) {
      return createVector(0, 0);
    }

    // ÉTAPE 1 : Calcul des vecteurs "ahead" (points de détection devant le véhicule)
    // ahead : point loin devant (30 fois la vitesse) - détection précoce
    let ahead = this.vel.copy();
    ahead.mult(30);
    
    // ahead2 : point proche devant (15 fois la vitesse) - détection fine
    // Permet de détecter les obstacles même si la vitesse est faible
    let ahead2 = ahead.copy();
    ahead2.mult(0.5);

    // ÉTAPE 2 : Calcul des positions absolues des points ahead
    let pointAuBoutDeAhead = this.pos.copy().add(ahead);      // Point loin devant
    let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);    // Point proche devant

    // ÉTAPE 3 : Détection de l'obstacle le plus proche du véhicule
    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

    // Si aucun obstacle trouvé, pas de force d'évitement nécessaire
    if (obstacleLePlusProche == undefined) {
      return createVector(0, 0);
    }

    // ÉTAPE 4 : Calcul du centre de l'obstacle (nécessaire pour la distance)
    // Les obstacles peuvent être circulaires (pos = centre) ou rectangulaires (pos = coin)
    let obstacleCenter;
    if (obstacleLePlusProche.r) {
      // Obstacle circulaire : pos est déjà le centre
      obstacleCenter = obstacleLePlusProche.pos;
    } else if (obstacleLePlusProche.w && obstacleLePlusProche.h) {
      // Obstacle rectangulaire : pos est le coin supérieur gauche
      // Centre = coin + (largeur/2, hauteur/2)
      obstacleCenter = createVector(
        obstacleLePlusProche.pos.x + obstacleLePlusProche.w / 2, 
        obstacleLePlusProche.pos.y + obstacleLePlusProche.h / 2
      );
    } else {
      // Fallback : assume que pos est le centre
      obstacleCenter = obstacleLePlusProche.pos;
    }

    // ÉTAPE 5 : Calcul des distances entre les points ahead et le centre de l'obstacle
    let distance1 = pointAuBoutDeAhead.dist(obstacleCenter);    // Distance au point loin
    let distance2 = pointAuBoutDeAhead2.dist(obstacleCenter);  // Distance au point proche
    let distance = min(distance1, distance2);                  // Prend la plus petite distance

    // ÉTAPE 6 : Calcul de la largeur de la zone d'évitement
    // Zone de sécurité devant le véhicule (demi-rayon)
    let largeurZoneEvitementDevantVaisseau = this.r / 2;
    
    // ÉTAPE 7 : Calcul du rayon effectif de l'obstacle
    // Pour les rectangles, utilise la moitié de la diagonale (rayon du cercle circonscrit)
    let obstacleRadius = 0;
    if (obstacleLePlusProche.r) {
      // Obstacle circulaire : rayon direct
      obstacleRadius = obstacleLePlusProche.r;
    } else if (obstacleLePlusProche.w && obstacleLePlusProche.h) {
      // Obstacle rectangulaire : rayon = demi-diagonale = sqrt(w² + h²) / 2
      // Cela crée un cercle imaginaire autour du rectangle pour la détection
      obstacleRadius = sqrt(
        obstacleLePlusProche.w * obstacleLePlusProche.w + 
        obstacleLePlusProche.h * obstacleLePlusProche.h
      ) / 2;
    } else {
      // Fallback : rayon par défaut
      obstacleRadius = 50;
    }

    // ÉTAPE 8 : Vérification de collision imminente
    // Collision si : distance < rayon_obstacle + zone_évitement + rayon_véhicule
    if (distance < obstacleRadius + largeurZoneEvitementDevantVaisseau + this.r) {
      // COLLISION DÉTECTÉE - Calcul de la force d'évitement
      
      // ÉTAPE 9 : Calcul du vecteur d'évitement
      // Utilise le point ahead le plus proche de l'obstacle
      let force;
      if (distance1 < distance2) {
        // Point loin plus proche : évite depuis ce point
        force = p5.Vector.sub(pointAuBoutDeAhead, obstacleCenter);
      } else {
        // Point proche plus proche : évite depuis ce point
        force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleCenter);
      }
      
      // ÉTAPE 10 : Normalisation de la force d'évitement
      // La force pointe du centre de l'obstacle vers le point ahead
      // On la normalise à maxSpeed (vitesse désirée)
      force.setMag(this.maxSpeed);
      
      // ÉTAPE 11 : Calcul de la force de steering
      // Force = Vitesse désirée - Vitesse actuelle
      force.sub(this.vel);
      
      // ÉTAPE 12 : Limitation de la force
      // La force est limitée à maxForce pour un mouvement fluide
      force.limit(this.maxForce);
      
      return force;  // Retourne la force d'évitement
    } else {
      // Pas de collision imminente, pas de force nécessaire
      return createVector(0, 0);
    }
  }

  /**
   * Trouve l'obstacle le plus proche du véhicule
   * 
   * ALGORITHME :
   * 1. Parcourt tous les obstacles
   * 2. Calcule le centre de chaque obstacle (gère rectangles et cercles)
   * 3. Calcule la distance entre le véhicule et le centre
   * 4. Retourne l'obstacle avec la plus petite distance
   * 
   * @param {Array} obstacles - Liste des obstacles
   * @returns {Obstacle|undefined} L'obstacle le plus proche ou undefined
   */
  getObstacleLePlusProche(obstacles) {
    let plusPetiteDistance = Infinity;  // Distance minimale trouvée
    let obstacleLePlusProche = undefined; // Obstacle le plus proche

    // Parcourt tous les obstacles pour trouver le plus proche
    obstacles.forEach(o => {
      // Calcule le centre de l'obstacle (nécessaire pour la distance)
      let obstacleCenter;
      if (o.r) {
        // Obstacle circulaire : pos est déjà le centre
        obstacleCenter = o.pos;
      } else if (o.w && o.h) {
        // Obstacle rectangulaire : pos est le coin supérieur gauche
        // Centre = coin + (largeur/2, hauteur/2)
        obstacleCenter = createVector(o.pos.x + o.w / 2, o.pos.y + o.h / 2);
      } else {
        // Fallback : assume que pos est le centre
        obstacleCenter = o.pos;
      }
      
      // Calcule la distance euclidienne entre le véhicule et le centre de l'obstacle
      const distance = this.pos.dist(obstacleCenter);

      // Met à jour l'obstacle le plus proche si cette distance est plus petite
      if (distance < plusPetiteDistance) {
        plusPetiteDistance = distance;
        obstacleLePlusProche = o;
      }
    });

    return obstacleLePlusProche;  // Retourne l'obstacle le plus proche (ou undefined)
  }

  // BOUNDARIES : exerce une force renvoyant vers le centre du canvas si le véhicule s'approche des bords
  boundaries() {
    const d = 25;

    let desired = null;

    // Si le véhicule est trop à gauche ou trop à droite
    if (this.pos.x < d) {
      desired = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > width - d) {
      desired = createVector(-this.maxSpeed, this.vel.y);
    }

    if (this.pos.y < d) {
      desired = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > height - d) {
      desired = createVector(this.vel.x, -this.maxSpeed);
    }

    if (desired !== null) {
      desired.normalize();
      desired.mult(this.maxSpeed);
      const steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce);
      return steer;
    }
    return createVector(0, 0);
  }

  // BOIDS : combinaison de separation, align, cohesion
  flock(vehicles, separationWeight = 1.5, alignWeight = 1.0, cohesionWeight = 1.0) {
    let sep = this.separate(vehicles).mult(separationWeight);
    let ali = this.align(vehicles).mult(alignWeight);
    let coh = this.cohesion(vehicles).mult(cohesionWeight);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }

  // applyForce est une méthode qui permet d'appliquer une force au véhicule
  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    // on ajoute l'accélération à la vitesse
    this.vel.add(this.acc);
    // on contraint la vitesse à la valeur maxSpeed
    this.vel.limit(this.maxSpeed);
    // on ajoute la vitesse à la position
    this.pos.add(this.vel);
    // on remet l'accélération à zéro
    this.acc.set(0, 0);
  }

  // Vérifie si le véhicule est mort
  isDead() {
    return this.health <= 0;
  }

  // Applique des dégâts
  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  // Soigne le véhicule
  heal(amount) {
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
  }

  // Vérifie la collision avec un autre véhicule
  collidesWith(other) {
    let d = p5.Vector.dist(this.pos, other.pos);
    return d < (this.r + other.r);
  }

  // Vérifie la collision avec un point
  collidesWithPoint(point, radius = 0) {
    let d = p5.Vector.dist(this.pos, point);
    return d < (this.r + radius);
  }

  // Que fait cette méthode ?
  // elle permet de faire réapparaitre le véhicule de 
  // l'autre côté du canvas
  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }

  // Dessine le véhicule (méthode de base, à surcharger)
  show() {
    stroke(255);
    strokeWeight(2);
    fill(255);
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    pop();
  }
}

