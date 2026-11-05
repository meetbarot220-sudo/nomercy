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
    this.stuckTimer = 0;
    this.lastX = fighter.x;
  }

  update(dt, fighters, arena) {
    const b = this.bot;
    if (!b.isAlive) return;

    this.targetCheckTimer -= dt;
    this.actionTimer -= dt;
    this.wanderTimer -= dt;

    // Unstick helper
    if (Math.abs(b.x - this.lastX) < 2 && b.onGround) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 1.2) {
        b.jump();
        this.wanderDir = -this.wanderDir;
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
      this.lastX = b.x;
    }

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
    const isBelowMainStage = b.y > 850;
    const isPastEdge = b.x < 100 || b.x > 1700;

    if (isBelowMainStage || isPastEdge) {
      // Find nearest safe platform
      let nearestX = 900;
      let minPlatformDist = 99999;
      for (const plat of arena.platforms) {
        const platX = plat.type === 'slope' ? Math.min(plat.x1, plat.x2) : plat.x;
        const platW = plat.type === 'slope' ? Math.abs(plat.x2 - plat.x1) : plat.w;
        const platY = plat.type === 'slope' ? (plat.y1 + plat.y2) / 2 : plat.y;
        const platCenterX = platX + platW / 2;
        const dist = Math.hypot(b.x - platCenterX, b.y - platY);
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
    }

    // 2. Stomp if above enemy
    if (Math.abs(dx) < 30 && dy > 20 && dy < 150 && b.vy > 0) {
      // Aim straight down for head bounce!
      b.move(dir, dt);
      return;
    }

    // 2b. Smart platform traversals (jump pads, lifts, movers)
    if (this.handlePlatformTraversals(dt, arena)) {
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

    if (this.handlePlatformTraversals(dt, arena)) {
      return;
    }

    b.move(this.wanderDir, dt);
  }

  // --- SMART PLATFORM TRAVERSAL (Jump pads, Lifts, Moving platforms) ---
  handlePlatformTraversals(dt, arena) {
    const b = this.bot;
    if (!this.target) return false;

    const dy = this.target.y - b.y;
    const dx = this.target.x - b.x;

    // 1. If on side platforms (mid_left / mid_right / low_left / low_right) and target is higher up, use jump pads!
    if (b.currentPlatform && (b.currentPlatform.id === 'mid_left' || b.currentPlatform.id === 'low_left') && dy < -50) {
      const pad = arena.springPads.find(p => p.platId === b.currentPlatform.id);
      if (pad) {
        const padCenterX = pad.x + pad.w / 2;
        if (Math.abs(b.x - padCenterX) > 12) {
          b.move(Math.sign(padCenterX - b.x), dt);
          return true;
        }
      }
    }
    if (b.currentPlatform && (b.currentPlatform.id === 'mid_right' || b.currentPlatform.id === 'low_right') && dy < -50) {
      const pad = arena.springPads.find(p => p.platId === b.currentPlatform.id);
      if (pad) {
        const padCenterX = pad.x + pad.w / 2;
        if (Math.abs(b.x - padCenterX) > 12) {
          b.move(Math.sign(padCenterX - b.x), dt);
          return true;
        }
      }
    }

    // 2. If riding a vertical lift:
    if (b.currentPlatform && (b.currentPlatform.style === 'lift' || b.currentPlatform.moveType === 'lift')) {
      const plat = b.currentPlatform;
      const isTargetHigher = dy < -40;
      const isLiftGoingUp = plat.vy < -5;
      const isLiftGoingDown = plat.vy > 5;
      const isAtTargetHeight = Math.abs(dy) < 55;

      if (isAtTargetHeight) {
        // Step off lift toward target
        b.move(Math.sign(dx), dt);
        if (Math.abs(dx) > 80 && b.onGround) b.jump();
        return true;
      } else if ((isTargetHigher && isLiftGoingUp) || (!isTargetHigher && isLiftGoingDown)) {
        // Ride lift smoothly
        const liftCenter = plat.x + plat.w / 2;
        if (Math.abs(b.x - liftCenter) > 20) {
          b.move(Math.sign(liftCenter - b.x), dt);
        } else {
          b.move(0, dt);
        }
        return true;
      }
    }

    // 3. If near a vertical lift that goes in the direction of target, board it!
    if (Math.abs(dy) > 90 && b.onGround) {
      for (const plat of arena.platforms) {
        if (plat.style === 'lift' && Math.abs(b.y - plat.y) < 20 && Math.abs(b.x - (plat.x + plat.w / 2)) < 120) {
          if ((dy < 0 && plat.y > plat.yTop) || (dy > 0 && plat.y < plat.yBottom)) {
            b.move(Math.sign((plat.x + plat.w / 2) - b.x), dt);
            return true;
          }
        }
      }
    }

    return false;
  }

  // --- PLATFORM EDGE DETECTION ---
  isLedgeAhead(fighter, dir, arena) {
    if (!fighter.onGround || !fighter.currentPlatform) return false;

    const plat = fighter.currentPlatform;
    const lookAheadDist = 28;
    const testX = fighter.x + dir * lookAheadDist;

    const xMin = plat.type === 'slope' ? Math.min(plat.x1, plat.x2) : plat.x;
    const xMax = plat.type === 'slope' ? Math.max(plat.x1, plat.x2) : plat.x + plat.w;

    // Check if testX falls beyond the current platform ends
    if (testX < xMin || testX > xMax) {
      // Check if there is another connected walkable platform or sloped bridge ahead at testX
      const hasSafeSurfaceAhead = arena.platforms.some(p => {
        if (p === plat) return false;
        if (p.type === 'slope') {
          return testX >= Math.min(p.x1, p.x2) - 6 && testX <= Math.max(p.x1, p.x2) + 6;
        }
        const platY = p.y || 0;
        const currentY = plat.type === 'slope' ? (plat.y1 + plat.y2) / 2 : plat.y;
        return testX >= p.x - 6 && testX <= p.x + p.w + 6 && Math.abs(platY - currentY) <= 40;
      });

      if (hasSafeSurfaceAhead) {
        return false; // Continuous walkable connection (e.g. main <-> bridge <-> side platform)
      }

      return true; // True perilous ledge ahead!
    }
    return false;
  }
}
