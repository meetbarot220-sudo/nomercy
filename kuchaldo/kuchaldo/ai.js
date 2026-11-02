/* ============================================================
   SQUISH BRAWL - BOT AI ENGINE
   Competent, dynamic AI with Distinct Personalities, Platform Awareness,
   Ledge Detection, Recovery Double-Jumps, and Target Switching
   ============================================================ */

class BotController {
  constructor(fighter) {
    this.bot = fighter;
    this.target = null;
    this.targetCheckTimer = Math.random() * 0.5;
    this.actionTimer = 0;
    this.reactionDelay = 0.08;
    this.wanderDir = Math.random() > 0.5 ? 1 : -1;
    this.wanderTimer = 1.0;
  }

  update(dt, fighters, arena) {
    const b = this.bot;
    if (!b.isAlive) return;

    this.targetCheckTimer -= dt;
    this.actionTimer -= dt;
    this.wanderTimer -= dt;

    // 1. RECOVERY PRIORITY: If falling off stage or in danger zone, try to recover!
    if (this.handleRecovery(arena)) {
      return;
    }

    // 2. TARGET SELECTION (Player or Rival Bots)
    if (this.targetCheckTimer <= 0 || !this.target || !this.target.isAlive) {
      this.targetCheckTimer = 0.4 + Math.random() * 0.3;
      this.selectTarget(fighters);
    }

    // 3. PERSONALITY-BASED DECISION MAKING
    switch (b.personality) {
      case 'aggressive': // Blaze
        this.updateAggressive(dt, arena);
        break;
      case 'defensive': // Aegis
        this.updateDefensive(dt, arena);
        break;
      case 'chaotic': // Wobble
        this.updateChaotic(dt, arena);
        break;
      default:
        this.updateAggressive(dt, arena);
    }
  }

  // --- SELECT TARGET ---
  selectTarget(fighters) {
    const b = this.bot;
    const aliveEnemies = fighters.filter(f => f !== b && f.isAlive);
    if (aliveEnemies.length === 0) {
      this.target = null;
      return;
    }

    // Personality affects target picking
    if (b.personality === 'chaotic') {
      // Chaotic switches randomly between any enemy
      this.target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      return;
    }

    if (b.personality === 'defensive') {
      // Defensive targets whoever is threatening or closest
      aliveEnemies.sort((a, bF) => {
        const distA = Math.hypot(a.x - b.x, a.y - b.y);
        const distB = Math.hypot(bF.x - b.x, bF.y - b.y);
        return distA - distB;
      });
      this.target = aliveEnemies[0];
      return;
    }

    // Aggressive: 50% chance nearest, 50% chance highest damage enemy to secure KO
    if (Math.random() > 0.5) {
      aliveEnemies.sort((a, bF) => bF.damagePercentage - a.damagePercentage);
      this.target = aliveEnemies[0];
    } else {
      aliveEnemies.sort((a, bF) => {
        const distA = Math.hypot(a.x - b.x, a.y - b.y);
        const distB = Math.hypot(bF.x - b.x, bF.y - b.y);
        return distA - distB;
      });
      this.target = aliveEnemies[0];
    }
  }

  // --- RECOVERY LOGIC ---
  handleRecovery(arena) {
    const b = this.bot;

    // Check if falling below stage platforms
    const isBelowMainStage = b.y > 750;
    const isPastEdge = b.x < 200 || b.x > 1600;

    if (isBelowMainStage || isPastEdge) {
      // Find nearest safe platform
      let nearestX = 900;
      let minPlatformDist = 99999;
      for (const plat of arena.platforms) {
        const platCenterX = plat.x + plat.w / 2;
        const dist = Math.hypot(b.x - platCenterX, b.y - plat.y);
        if (dist < minPlatformDist) {
          minPlatformDist = dist;
          nearestX = platCenterX;
        }
      }

      // Steer toward center
      const dir = b.x < nearestX ? 1 : -1;
      b.move(dir, 0.016);

      // Jump if falling and has jump remaining
      if (b.vy > 50 && b.jumpsRemaining > 0) {
        b.jump();
      }

      // Dash towards center if available
      if (b.dashCooldown <= 0 && Math.abs(b.x - nearestX) > 200) {
        b.dash();
      }

      return true; // recovery takes priority
    }
    return false;
  }

  // --- AGGRESSIVE BOT (Blaze) ---
  updateAggressive(dt, arena) {
    const b = this.bot;
    if (!this.target) return;

    const dx = this.target.x - b.x;
    const dy = this.target.y - b.y;
    const dist = Math.hypot(dx, dy);
    const dir = Math.sign(dx);

    // 1. Attack or Stomp if in range
    if (dist < 65 && Math.abs(dy) < 35) {
      b.attack();
    } else if (dist < 130 && Math.abs(dy) < 30 && b.dashCooldown <= 0) {
      // Dash ram
      b.dash();
    }

    // 2. Stomp if above enemy
    if (Math.abs(dx) < 30 && dy > 20 && dy < 150 && b.vy > 0) {
      // Aim straight down for head bounce!
      b.move(dir, dt);
      return;
    }

    // 3. Check if edge is ahead before running off
    if (b.onGround && this.isLedgeAhead(b, dir, arena)) {
      // If target is across gap or higher up, jump!
      if (dist > 80) {
        b.jump();
      } else {
        // Stop at edge
        b.move(0, dt);
        return;
      }
    }

    // 4. Move toward target
    b.move(dir, dt);

    // 5. Vertical navigation
    if (dy < -45 && (b.onGround || b.jumpsRemaining > 0)) {
      // Target is higher up -> jump
      b.jump();
    } else if (dy > 65 && b.onGround && b.currentPlatform && b.currentPlatform.type === 'jumpthrough') {
      // Target is below on lower platform -> drop down
      b.dropDown();
    }
  }

  // --- DEFENSIVE BOT (Aegis) ---
  updateDefensive(dt, arena) {
    const b = this.bot;

    // Check nearby powerups first!
    const availablePowerup = window.powerUpManager.items[0];
    if (availablePowerup && !b.activeBuff) {
      const pDx = availablePowerup.x - b.x;
      const pDy = availablePowerup.currentY - b.y;
      const pDir = Math.sign(pDx);

      b.move(pDir, dt);
      if (pDy < -40 && b.onGround) b.jump();
      if (pDy > 50 && b.onGround) b.dropDown();
      return;
    }

    if (!this.target) return;

    const dx = this.target.x - b.x;
    const dy = this.target.y - b.y;
    const dist = Math.hypot(dx, dy);

    // If enemy is too close, counter-attack then back away
    if (dist < 60) {
      b.attack();
      // Retreat
      const retreatDir = -Math.sign(dx);
      if (!this.isLedgeAhead(b, retreatDir, arena)) {
        b.move(retreatDir, dt);
      }
    } else if (dist < 200) {
      // Maintain safe medium distance
      const keepDistDir = -Math.sign(dx);
      if (!this.isLedgeAhead(b, keepDistDir, arena)) {
        b.move(keepDistDir, dt);
      } else {
        b.move(0, dt);
      }
    } else {
      // Slowly advance or seek high platform
      const targetPlatY = 520;
      if (b.y > targetPlatY && b.onGround) {
        b.jump();
      }
      b.move(Math.sign(dx), dt);
    }
  }

  // --- CHAOTIC BOT (Wobble) ---
  updateChaotic(dt, arena) {
    const b = this.bot;

    // Changes wander direction periodically
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 0.8 + Math.random() * 1.5;
      this.wanderDir = Math.random() > 0.5 ? 1 : -1;

      // Random spontaneous actions
      if (Math.random() < 0.35 && b.onGround) {
        b.jump();
      } else if (Math.random() < 0.25) {
        b.dropDown();
      } else if (Math.random() < 0.2 && b.dashCooldown <= 0) {
        b.dash();
      }
    }

    // If near enemy, swing wildly!
    if (this.target) {
      const dist = Math.hypot(this.target.x - b.x, this.target.y - b.y);
      if (dist < 75) {
        b.attack();
      }
    }

    // Avoid walking off perilous edge
    if (b.onGround && this.isLedgeAhead(b, this.wanderDir, arena)) {
      if (Math.random() < 0.6) {
        b.jump();
      } else {
        this.wanderDir = -this.wanderDir;
      }
    }

    b.move(this.wanderDir, dt);
  }

  // --- PLATFORM EDGE DETECTION ---
  isLedgeAhead(fighter, dir, arena) {
    if (!fighter.onGround || !fighter.currentPlatform) return false;

    const plat = fighter.currentPlatform;
    const lookAheadDist = 28;
    const testX = fighter.x + dir * lookAheadDist;

    // Check if testX falls beyond the current platform ends
    if (testX < plat.x || testX > plat.x + plat.w) {
      return true; // Edge ahead!
    }
    return false;
  }
}
