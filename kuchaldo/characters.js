/* ============================================================
   SQUISH BRAWL - CHARACTERS SYSTEM
   🔴 Player = RED (Exclusively reserved for human player)
   🟢 Bot 1 = GREEN (Blaze - Aggressive)
   🔵 Bot 2 = BLUE (Aegis - Defensive)
   🟡 Bot 3 = YELLOW (Wobble - Chaotic)
   ============================================================ */

const CHARACTER_THEMES = {
  player: {
    name: 'Player',
    colorName: 'RED',
    gradTop: '#ff5e78',
    gradMid: '#ff2240',
    gradBottom: '#a60822',
    outline: '#ffcc00', // Distinct gold outline for player
    outlineWidth: 3.5,
    fistColor: '#ff2240',
    fistOutline: '#660010',
    glow: 'rgba(255, 42, 75, 0.45)',
    cardBorder: '#ff3344'
  },
  bot_blaze: {
    name: 'Blaze',
    colorName: 'GREEN',
    gradTop: '#34d399',
    gradMid: '#10b981',
    gradBottom: '#047857',
    outline: '#064e3b',
    outlineWidth: 2.5,
    fistColor: '#10b981',
    fistOutline: '#064e3b',
    glow: 'rgba(16, 185, 129, 0.45)',
    cardBorder: '#10b981'
  },
  bot_aegis: {
    name: 'Aegis',
    colorName: 'BLUE',
    gradTop: '#60a5fa',
    gradMid: '#2563eb',
    gradBottom: '#1e40af',
    outline: '#1e3a8a',
    outlineWidth: 2.5,
    fistColor: '#2563eb',
    fistOutline: '#1e3a8a',
    glow: 'rgba(37, 99, 235, 0.45)',
    cardBorder: '#3b82f6'
  },
  bot_wobble: {
    name: 'Wobble',
    colorName: 'YELLOW',
    gradTop: '#fde047',
    gradMid: '#eab308',
    gradBottom: '#a16207',
    outline: '#713f12',
    outlineWidth: 2.5,
    fistColor: '#eab308',
    fistOutline: '#713f12',
    glow: 'rgba(234, 179, 8, 0.45)',
    cardBorder: '#facc15'
  }
};

class Fighter {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.isBot = config.isBot;
    this.accessory = config.accessory; // 'crown', 'mohawk', 'horns', 'propeller'
    this.personality = config.personality || 'player';
    this.themeKey = config.themeKey || (this.isBot ? 'bot_blaze' : 'player');
    this.theme = CHARACTER_THEMES[this.themeKey] || CHARACTER_THEMES.player;

    // Position & Physics
    this.x = config.x || 900;
    this.y = config.y || 600;
    this.vx = 0;
    this.vy = 0;
    this.radius = 25; // 1.3x larger than 19px standard (~50px diameter)
    this.facing = config.facing || 1; // 1 = right, -1 = left

    // Movement speeds
    this.maxSpeed = 440;
    this.accel = 2600;
    this.friction = 2800;
    this.airControl = 0.82;
    this.gravity = 1450;
    this.jumpStrength = -640;
    this.doubleJumpStrength = -580;

    // Platform & Air state
    this.onGround = false;
    this.currentPlatform = null;
    this.jumpsRemaining = 2; // 1 ground jump + 1 air jump
    this.isDroppingDown = false;
    this.dropDownTimer = 0;

    // Squash & Stretch Spring Physics
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.scaleVx = 0;
    this.scaleVy = 0;
    this.springK = 180;
    this.springDamping = 12;

    // Combat & Damage
    this.damagePercentage = 0;
    this.isAlive = true;
    this.hitStunTimer = 0;
    this.invulnerableTimer = 0;
    this.attackCooldown = 0;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.22;
    this.attackHitFighters = new Set();

    // 3-second Punch Power Block (when squished, cannot punch for 3s; character looks completely normal)
    this.punchBlockTimer = 0;

    // Power-up Buff & Shield
    this.activeBuff = null;
    this.hasShield = false;

    // Visual eye blinking & animation
    this.eyeBlinkTimer = 1 + Math.random() * 3;
    this.isBlinking = false;
    this.wobbleAngle = 0;
    this.walkCycle = 0;

    // Match statistics
    this.fistScore = 0;
    this.squeezeScore = 0;
    this.killScore = 0;
    this.score = 0;
    this.kills = 0;
    this.damageDealt = 0;
    this.survivalTime = 0;
    this.squeezeDebounceTimer = 0;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.damagePercentage = 0;
    this.isAlive = true;
    this.onGround = false;
    this.currentPlatform = null;
    this.jumpsRemaining = 2;
    this.scaleX = 1;
    this.scaleY = 1;
    this.hitStunTimer = 0;
    this.invulnerableTimer = 1.0; // safe spawn shield
    this.attackCooldown = 0;
    this.isAttacking = false;
    this.punchBlockTimer = 0;
    this.activeBuff = null;
    this.hasShield = false;
    this.fistScore = 0;
    this.squeezeScore = 0;
    this.killScore = 0;
    this.score = 0;
    this.kills = 0;
    this.killPointsAwarded = false;
    this.damageDealt = 0;
    this.survivalTime = 0;
    this.squeezeDebounceTimer = 0;
  }

  // --- ACTIONS ---

  move(dir, dt) {
    if (this.hitStunTimer > 0 || !this.isAlive) return;

    if (dir !== 0) {
      this.facing = dir > 0 ? 1 : -1;
      const speedMult = this.activeBuff && this.activeBuff.id === 'SPEED_BOOTS' ? 1.4 : 1.0;
      const targetSpeed = dir * this.maxSpeed * speedMult;
      const accelRate = (this.onGround ? this.accel : this.accel * this.airControl) * dt;

      if (Math.sign(this.vx) !== Math.sign(dir) && Math.abs(this.vx) > 50) {
        // Quick turn friction
        this.vx += dir * this.friction * dt;
      } else {
        this.vx += (targetSpeed - this.vx) * Math.min(1, accelRate / this.maxSpeed * 3);
      }

      if (this.onGround) {
        this.walkCycle += dt * 14;
        if (Math.random() < 0.2) {
          window.particles.spawnDust(this.x, this.y, 1, this.facing);
        }
      }
    } else if (this.onGround) {
      // Snappy ground deceleration
      const decel = this.friction * dt;
      if (Math.abs(this.vx) <= decel) {
        this.vx = 0;
      } else {
        this.vx -= Math.sign(this.vx) * decel;
      }
    }
  }

  jump() {
    if (this.hitStunTimer > 0 || !this.isAlive) return;

    const jumpMult = this.activeBuff && this.activeBuff.id === 'SPRING_SHOES' ? 1.35 : 1.0;

    if (this.onGround || this.jumpsRemaining === 2) {
      // First Jump
      this.vy = this.jumpStrength * jumpMult;
      this.onGround = false;
      this.currentPlatform = null;
      this.jumpsRemaining = 1;

      // Stretch vertically
      this.scaleX = 0.78;
      this.scaleY = 1.32;
      window.soundEngine.playJump();
      window.particles.spawnDust(this.x, this.y, 6, 0);

    } else if (this.jumpsRemaining === 1) {
      // Double Jump
      this.vy = this.doubleJumpStrength * jumpMult;
      this.jumpsRemaining = 0;

      // Air squash & stretch
      this.scaleX = 0.75;
      this.scaleY = 1.35;
      window.soundEngine.playDoubleJump();
      window.particles.spawnDust(this.x, this.y, 8, 0);
      window.particles.spawnImpact(this.x, this.y, '#ffffff', 6, 0.4);
    }
  }

  dropDown() {
    // Platform drop-through completely disabled for all characters (both player and bots)
    // To descend, characters must physically walk off the edge of the platform
    return;
  }

  // Dash removed as per specifications
  dash() {}

  attack() {
    // Punch blocked for 3s after being squished, or during cooldown/hitstun
    if (this.punchBlockTimer > 0 || this.attackCooldown > 0 || this.hitStunTimer > 0 || !this.isAlive) return;

    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.attackCooldown = 0.32;
    this.attackHitFighters.clear();

    // Small forward lunge
    this.vx += this.facing * 180;

    // Quick squash/stretch
    this.scaleX = 1.25;
    this.scaleY = 0.85;

    window.soundEngine.playPunchSwing();
  }

  // --- TAKE HIT & KNOCKBACK ---
  takeHit(attacker, damage, baseKnockback, angle) {
    if (this.invulnerableTimer > 0 || !this.isAlive) return false;

    // 1. Check Bubble Shield
    if (this.hasShield) {
      this.hasShield = false;
      if (this.activeBuff && this.activeBuff.id === 'BUBBLE_SHIELD') {
        this.activeBuff = null;
      }
      this.invulnerableTimer = 0.4;
      window.soundEngine.playShieldBreak();
      window.particles.spawnShockwave(this.x, this.y - this.radius, 80, '#a855f7', 0.4);
      window.particles.spawnCombatText(this.x, this.y - 45, 'BLOCKED!', '#a855f7', 22);

      // Push attacker back slightly
      attacker.vx = -attacker.facing * 350;
      attacker.scaleX = 1.2;
      return false;
    }

    // 2. Accumulate Damage %
    this.damagePercentage += damage;
    attacker.damageDealt += damage;

    // Knockback scaling: like Smash Bros, knockback increases exponentially with damage %
    const knockbackMultiplier = 1 + (this.damagePercentage / 55);
    const hasTitanFist = attacker.activeBuff && attacker.activeBuff.id === 'TITAN_FIST';

    // Knockback power calculation:
    // 1. PLAYER -> BOT: 40% Titan Fist power (1.60x) + 10% knockback bonus specifically against bots (1.10x) = 1.76x
    // 2. BOT -> PLAYER / BOT: Normal/default knockback (1.0x). Fair, consistent combat without excessive launch!
    let knockbackPower = 1.0;
    if (!attacker.isBot) {
      const titanFistBonus = hasTitanFist ? 2.5 : 1.60;
      const botBonus = this.isBot ? 1.10 : 1.0;
      knockbackPower = titanFistBonus * botBonus;
    } else {
      // Normal bot punch knockback
      knockbackPower = hasTitanFist ? 2.5 : 1.0;
    }

    // SQUISH Punch Block: if attacker's punch power is blocked, zero knockback
    if (attacker.punchBlockTimer > 0) {
      knockbackPower = 0;
    }

    const totalKnockback = (baseKnockback * knockbackMultiplier * knockbackPower);

    this.vx = Math.cos(angle) * totalKnockback;
    this.vy = Math.sin(angle) * totalKnockback;

    // Stun duration scales with knockback
    this.hitStunTimer = Math.min(0.65, 0.18 + (totalKnockback / 2400));
    this.invulnerableTimer = 0.15;
    this.onGround = false;
    this.currentPlatform = null;

    // Squash wobble
    this.scaleX = 0.65;
    this.scaleY = 1.45;

    // Hit-stop effect (micro freeze frame)
    window.gameEngine.triggerHitStop(hasTitanFist ? 70 : 45);

    // Audio & Particles
    window.soundEngine.playHit(hasTitanFist || totalKnockback > 700);
    window.particles.spawnImpact(this.x, this.y - this.radius, hasTitanFist ? '#ff3300' : '#ffcc00', 18, 1.2);

    const hitWord = totalKnockback > 900 ? 'SMASH!' : (totalKnockback > 500 ? 'POW!' : 'HIT!');
    window.particles.spawnCombatText(this.x, this.y - 45, hitWord, '#ffde59', totalKnockback > 800 ? 30 : 22);

    // Screen Shake on strong hits
    if (totalKnockback > 600) {
      window.gameCamera.shake(Math.min(18, totalKnockback / 60));
    }

    this.lastAttacker = attacker;
    return true;
  }

  // --- STOMP / HEAD BOUNCE ---
  stomp(victim) {
    if (!this.isAlive || !victim.isAlive) return;

    // Squeeze debounce: ensure each squeeze is counted only once
    if (victim.squeezeDebounceTimer > 0) return;
    victim.squeezeDebounceTimer = 0.45;

    // SQUISH: Punching power blocked for exactly 3 seconds (can still move and jump normally, NO stun visuals)
    victim.punchBlockTimer = 3.0;

    // Award exactly 50 points for every successful squeeze directly to score
    if (!this.isBot) {
      this.squeezeScore = (this.squeezeScore || 0) + 50;
      this.score = (this.fistScore || 0) + this.squeezeScore + (this.killScore || 0);
      window.particles.spawnCombatText(victim.x, victim.y - 45, '+50 SQUEEZE', '#38bdf8', 22);
      if (window.gameEngine) {
        window.gameEngine.updateHUD();
      }
    } else {
      this.squeezeScore = (this.squeezeScore || 0) + 50;
      this.score = (this.fistScore || 0) + this.squeezeScore + (this.killScore || 0);
    }

    // Stomper bounces up high
    this.vy = -680;
    this.onGround = false;
    this.jumpsRemaining = 1;
    this.scaleX = 0.7;
    this.scaleY = 1.4;

    // Victim gets squashed downward briefly without movement lock
    victim.damagePercentage += 12;
    this.damageDealt += 12;
    victim.vy = 450;
    victim.scaleX = 1.5;
    victim.scaleY = 0.55;
    victim.hitStunTimer = 0; // No stun movement restriction! Can run and jump normally immediately!

    window.gameEngine.triggerHitStop(40);
    window.soundEngine.playStomp();
    window.particles.spawnShockwave(victim.x, victim.y - victim.radius * 2, 50, '#ff3344', 0.25);
    window.particles.spawnCombatText(victim.x, victim.y - 65, 'SQUISH!', '#ff3344', 24);
    window.gameCamera.shake(8);

    victim.lastAttacker = this;
  }

  // --- UPDATE LOOP ---
  update(dt, arena) {
    if (!this.isAlive) return;

    if (window.gameEngine && window.gameEngine.state === 'PLAYING') {
      this.survivalTime += dt;
    }

    // 1. Timers
    if (this.hitStunTimer > 0) this.hitStunTimer -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.punchBlockTimer > 0) this.punchBlockTimer -= dt;
    if (this.squeezeDebounceTimer > 0) this.squeezeDebounceTimer -= dt;

    if (this.dropDownTimer > 0) {
      this.dropDownTimer -= dt;
      if (this.dropDownTimer <= 0) {
        this.isDroppingDown = false;
      }
    }

    // Active Attack Timer
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    // Active Buff Timer
    if (this.activeBuff) {
      this.activeBuff.remaining -= dt;
      if (this.activeBuff.remaining <= 0) {
        this.activeBuff = null;
      }
    }

    // 2. Physics & Gravity
    if (!this.onGround) {
      this.vy += this.gravity * dt;
      // Air drag
      this.vx *= Math.pow(0.985, dt * 60);
    } else {
      // If in hit stun on ground, smoothly slide with momentum
      if (this.hitStunTimer > 0) {
        this.vx *= Math.pow(0.92, dt * 60);
      }
      // Carry momentum of moving platforms & vertical lifts
      if (this.currentPlatform && (this.currentPlatform.style === 'moving' || this.currentPlatform.style === 'lift')) {
        this.x += (this.currentPlatform.vx || 0) * dt;
        this.y += (this.currentPlatform.vy || 0) * dt;
      }
    }

    // Terminal velocity clamp to prevent glitchy tunneling
    this.vx = Math.max(-1200, Math.min(1200, this.vx));
    this.vy = Math.max(-1400, Math.min(1300, this.vy));

    // Position integration
    const prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 3. Platform Collisions (Solid from above, zero downward drop-through)
    this.resolvePlatformCollisions(arena, dt, prevY);

    // 4. Spring Pad Bounce Check
    arena.checkSpringPad(this);

    // 5. Blast Zone Check (Elimination)
    const bz = arena.blastZones;
    if (this.x < bz.left || this.x > bz.right || this.y < bz.top || this.y > bz.bottom) {
      this.eliminate();
      return;
    }

    // 6. Squash & Stretch Spring Physics (Damped Harmonic Oscillator)
    const fx = -this.springK * (this.scaleX - 1.0) - this.springDamping * this.scaleVx;
    const fy = -this.springK * (this.scaleY - 1.0) - this.springDamping * this.scaleVy;
    this.scaleVx += fx * dt;
    this.scaleVy += fy * dt;
    this.scaleX += this.scaleVx * dt;
    this.scaleY += this.scaleVy * dt;

    // Clamp scales to pleasant range
    this.scaleX = Math.max(0.4, Math.min(1.8, this.scaleX));
    this.scaleY = Math.max(0.4, Math.min(1.8, this.scaleY));

    // 7. Eye blinking logic
    this.eyeBlinkTimer -= dt;
    if (this.eyeBlinkTimer <= 0) {
      this.isBlinking = true;
      if (this.eyeBlinkTimer <= -0.15) {
        this.isBlinking = false;
        this.eyeBlinkTimer = 2 + Math.random() * 4;
      }
    }
  }

  // --- PLATFORM COLLISION RESOLUTION (Solid from above, zero drop-through) ---
  resolvePlatformCollisions(arena, dt = 1/60, prevY = this.y) {
    const prevOnGround = this.onGround;
    let groundedThisFrame = false;

    // Foot check point
    const footX = this.x;
    const footY = this.y;

    for (const plat of arena.platforms) {
      if (plat.type === 'slope') {
        const xMin = Math.min(plat.x1, plat.x2);
        const xMax = Math.max(plat.x1, plat.x2);

        // Foot horizontal bounds check with margin for smooth crossing
        if (footX >= xMin - 8 && footX <= xMax + 8) {
          const t = Math.max(0, Math.min(1, (footX - plat.x1) / (plat.x2 - plat.x1)));
          const surfaceY = plat.y1 + t * (plat.y2 - plat.y1);

          // Check if already on this slope, transitioning from connected platforms, or landing
          const isOnSlope = (this.currentPlatform === plat && this.onGround);
          const isSteppingOn = (this.onGround && Math.abs(footY - surfaceY) <= 24);
          const isLanding = (this.vy >= 0 && (
            (prevY <= surfaceY + 4 && footY >= surfaceY - 6) ||
            (footY >= surfaceY - 8 && footY <= surfaceY + 28)
          ));

          if (isOnSlope || isSteppingOn || isLanding) {
            this.y = surfaceY;
            this.vy = 0;
            this.onGround = true;
            this.currentPlatform = plat;
            this.jumpsRemaining = 2;
            groundedThisFrame = true;

            if (!prevOnGround) {
              this.scaleX = 1.35;
              this.scaleY = 0.65;
              window.soundEngine.playHit(false);
              window.particles.spawnDust(this.x, this.y, 5, 0);
            }
            break;
          }
        }
        continue;
      }

      // Horizontal platform bounds (works for both solid and jumpthrough)
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;
      const platTop = plat.y;
      const platBottom = plat.y + (plat.h || 20);

      // Edge tolerance
      const isBridgeConnected = (plat.id === 'main' || plat.id === 'low_left' || plat.id === 'low_right');
      const horizTol = isBridgeConnected ? 2 : 12;

      // 1. If currently standing on this platform, stay solidly locked to its surface while feet are on platform
      const isCurrentlyStanding = (this.onGround && this.currentPlatform === plat);
      if (isCurrentlyStanding && this.vy >= 0) {
        if (footX >= platLeft - horizTol && footX <= platRight + horizTol) {
          this.y = platTop;
          this.vy = 0;
          this.onGround = true;
          this.currentPlatform = plat;
          this.jumpsRemaining = 2;
          groundedThisFrame = true;
          break;
        }
      }

      // 2. Landing from above (falling downwards: vy >= 0)
      if (this.vy >= 0 && footX >= platLeft - horizTol && footX <= platRight + horizTol) {
        // Continuous swept check + landing threshold
        const crossedTop = (prevY <= platTop + 4 && footY >= platTop - 4);
        const withinLandingWindow = (footY >= platTop - 4 && footY <= platTop + Math.max(26, Math.abs(this.vy * dt) + 10));

        if (crossedTop || withinLandingWindow) {
          this.y = platTop;
          this.vy = 0;
          this.onGround = true;
          this.currentPlatform = plat;
          this.jumpsRemaining = 2;
          groundedThisFrame = true;

          if (!prevOnGround) {
            this.scaleX = 1.35;
            this.scaleY = 0.65;
            window.soundEngine.playHit(false);
            window.particles.spawnDust(this.x, this.y, 6, 0);
          }
          break;
        }
      }

      // 3. For solid platforms: Ceiling and wall collisions
      if (plat.type === 'solid') {
        // Head hit ceiling (jumping up from below: vy < 0)
        const headY = this.y - this.radius * 2;
        if (this.vy < 0 &&
            footX >= platLeft &&
            footX <= platRight &&
            headY <= platBottom &&
            headY >= platBottom - 18) {
          this.y = platBottom + this.radius * 2;
          this.vy = 50; // bump down
          this.scaleX = 1.25;
          this.scaleY = 0.75;
          window.particles.spawnDust(this.x, platBottom, 4, 0);
        }

        // Side walls collision
        const bodyCenterY = this.y - this.radius;
        if (bodyCenterY >= platTop + 12 && bodyCenterY < platBottom) {
          const hasLeftBridge = (plat.id === 'main' || plat.id === 'low_right');
          const hasRightBridge = (plat.id === 'main' || plat.id === 'low_left');

          if (!hasLeftBridge && this.vx > 0 && this.x + this.radius >= platLeft && this.x < platLeft + 15) {
            this.x = platLeft - this.radius;
            this.vx = 0;
          } else if (!hasRightBridge && this.vx < 0 && this.x - this.radius <= platRight && this.x > platRight - 15) {
            this.x = platRight + this.radius;
            this.vx = 0;
          }
        }
      }
    }

    if (!groundedThisFrame && this.onGround) {
      // Physically walked off platform edge -> falls naturally
      this.onGround = false;
      this.currentPlatform = null;
      if (this.jumpsRemaining === 2) {
        this.jumpsRemaining = 1; // can still double-jump
      }
    }
  }

  // --- ELIMINATION ---
  eliminate() {
    if (!this.isAlive) return;
    this.isAlive = false;

    window.soundEngine.playElimination();
    window.particles.spawnRingoutExplosion(this.x, this.y);
    window.gameCamera.shake(20);

    if (this.lastAttacker && this.lastAttacker !== this) {
      this.lastAttacker.kills++;
      window.particles.spawnCombatText(
        this.lastAttacker.x,
        this.lastAttacker.y - 50,
        '+1 KO!',
        '#ffde59',
        26
      );
    }

    window.gameEngine.onFighterEliminated(this);
  }

  // --- RENDER CHARACTER ---
  render(ctx) {
    if (!this.isAlive) return;

    ctx.save();
    // Center at character base/feet
    ctx.translate(this.x, this.y);

    // Ground Shadow
    if (this.onGround) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius * 0.9 * this.scaleX, 6 * this.scaleY, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Apply Squash & Stretch scaling
    ctx.scale(this.scaleX, this.scaleY);

    // Invulnerability flashing (e.g. on respawn)
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    const bodyRadius = this.radius;
    const bodyCenterY = -bodyRadius;

    // 1. Outer Power-up Buff Aura or Shield
    if (this.hasShield) {
      ctx.beginPath();
      ctx.arc(0, bodyCenterY, bodyRadius + 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (this.activeBuff) {
      ctx.beginPath();
      ctx.arc(0, bodyCenterY, bodyRadius + 8, 0, Math.PI * 2);
      ctx.fillStyle = this.activeBuff.aura;
      ctx.fill();
      ctx.strokeStyle = this.activeBuff.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 2. Character Body (RED for Player, GREEN/BLUE/YELLOW for Bots)
    const theme = this.theme;
    const bodyGrad = ctx.createRadialGradient(-6, bodyCenterY - 6, 4, 0, bodyCenterY, bodyRadius + 4);
    bodyGrad.addColorStop(0, theme.gradTop);
    bodyGrad.addColorStop(0.65, theme.gradMid);
    bodyGrad.addColorStop(1, theme.gradBottom);

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, bodyCenterY, bodyRadius, 0, Math.PI * 2);
    ctx.fill();

    // SQUISH VISUAL INDICATOR: Bold black outer line for 3 seconds (Only a visual indicator, NO stun)
    if (this.punchBlockTimer > 0) {
      const fadeProgress = Math.min(1, this.punchBlockTimer / 0.35);
      ctx.strokeStyle = `rgba(0, 0, 0, ${fadeProgress})`;
      ctx.lineWidth = 5.5; // Thick, clearly visible black outer border
      ctx.stroke();

      if (fadeProgress < 1) {
        ctx.strokeStyle = theme.outline;
        ctx.lineWidth = theme.outlineWidth * (1 - fadeProgress);
        ctx.stroke();
      }
    } else {
      // Normal cartoon character outline
      ctx.strokeStyle = theme.outline;
      ctx.lineWidth = theme.outlineWidth;
      ctx.stroke();
    }

    // 3. Cute Cartoon Eyes
    const eyeOffsetX = this.facing * 7;
    const eyeY = bodyCenterY - 2;

    if (!this.isBlinking) {
      // Left & Right eye whites
      ctx.fillStyle = '#ffffff';

      if (this.accessory === 'propeller') {
        // Wobble's chaotic dizzy swirling eyes!
        [-6, 6].forEach(ox => {
          ctx.beginPath();
          ctx.arc(ox + eyeOffsetX, eyeY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Spiral
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(ox + eyeOffsetX + Math.sin(window.arena.time * 8) * 2, eyeY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Standard expressive brawler eyes
        [-6, 6].forEach(ox => {
          ctx.beginPath();
          ctx.ellipse(ox + eyeOffsetX, eyeY, 4.5, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Black Pupil tracking facing direction
          ctx.fillStyle = '#111827';
          ctx.beginPath();
          ctx.arc(ox + eyeOffsetX + (this.facing * 2), eyeY + 0.5, 2.6, 0, Math.PI * 2);
          ctx.fill();

          // White Sparkle reflection
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ox + eyeOffsetX + (this.facing * 1.5) - 1, eyeY - 2, 1.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Bot 1 (Blaze) has aggressive angry eyebrows
      if (this.accessory === 'mohawk') {
        ctx.strokeStyle = '#2b0006';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-11 + eyeOffsetX, eyeY - 8);
        ctx.lineTo(-2 + eyeOffsetX, eyeY - 5);
        ctx.moveTo(11 + eyeOffsetX, eyeY - 8);
        ctx.lineTo(2 + eyeOffsetX, eyeY - 5);
        ctx.stroke();
      }
    } else {
      // Blink lines
      ctx.strokeStyle = '#220005';
      ctx.lineWidth = 2.5;
      [-6, 6].forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(ox + eyeOffsetX - 4, eyeY);
        ctx.lineTo(ox + eyeOffsetX + 4, eyeY);
        ctx.stroke();
      });
    }

    // 4. Distinctive Accessories (Crown exclusively reserved for human Player)
    if (!this.isBot && this.accessory === 'crown') {
      // PLAYER: Gleaming Golden Crown
      const crownY = bodyCenterY - bodyRadius + 4;
      ctx.fillStyle = '#ffcc00';
      ctx.strokeStyle = '#b38f00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, crownY);
      ctx.lineTo(-14, crownY - 14);
      ctx.lineTo(-6, crownY - 6);
      ctx.lineTo(0, crownY - 16);
      ctx.lineTo(6, crownY - 6);
      ctx.lineTo(14, crownY - 14);
      ctx.lineTo(16, crownY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crown Ruby Jewel
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(0, crownY - 4, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.accessory === 'horns') {
      // BOT 2 (Aegis): Viking Horns & Visor
      const hornY = bodyCenterY - bodyRadius + 6;
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;

      // Left Horn
      ctx.beginPath();
      ctx.moveTo(-14, hornY);
      ctx.quadraticCurveTo(-22, hornY - 14, -18, hornY - 18);
      ctx.quadraticCurveTo(-14, hornY - 12, -8, hornY - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Horn
      ctx.beginPath();
      ctx.moveTo(14, hornY);
      ctx.quadraticCurveTo(22, hornY - 14, 18, hornY - 18);
      ctx.quadraticCurveTo(14, hornY - 12, 8, hornY - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

    } else if (this.accessory === 'propeller') {
      // BOT 3 (Wobble): Striped Propeller Beanie
      const capY = bodyCenterY - bodyRadius + 4;
      // Cap dome
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(0, capY, 12, Math.PI, 0);
      ctx.fill();

      // Spinny propeller
      const spin = Math.sin(window.arena.time * 24) * 14;
      ctx.strokeStyle = '#ffde59';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-spin, capY - 12);
      ctx.lineTo(spin, capY - 12);
      ctx.stroke();

      // Cap pin
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, capY - 12, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.accessory === 'princess_bow') {
      // BOT 1 (Blaze - Green Bot): Beautiful Pink Satin Princess Bow
      const bowW = 38;
      const bowH = 37;
      const bowX = -bowW / 2;
      const bowY = bodyCenterY - bodyRadius - 16;

      if (Fighter.bowImage && Fighter.bowImage.complete && Fighter.bowImage.naturalWidth > 0) {
        ctx.drawImage(Fighter.bowImage, bowX, bowY, bowW, bowH);
      } else {
        this.renderProceduralPinkBow(ctx, bodyCenterY - bodyRadius);
      }
    }

    // 5. Attack / Punch Fist Rendering
    if (this.isAttacking) {
      const punchProgress = (this.attackDuration - this.attackTimer) / this.attackDuration;
      const punchDist = Math.sin(punchProgress * Math.PI) * 36;
      const fistX = this.facing * (bodyRadius + punchDist);
      const fistY = bodyCenterY + 4;

      // Boxing glove fist
      const hasTitanFist = this.activeBuff && this.activeBuff.id === 'TITAN_FIST';
      ctx.fillStyle = hasTitanFist ? '#ff3300' : this.theme.fistColor;
      ctx.strokeStyle = hasTitanFist ? '#ffff00' : this.theme.fistOutline;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(fistX, fistY, hasTitanFist ? 16 : 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wind streak
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.facing * bodyRadius, fistY);
      ctx.lineTo(fistX, fistY);
      ctx.stroke();
    }

    // Restore transforms for HUD overhead tag
    ctx.restore();

    // 6. Overhead Tag (Always facing upright without squash deformation)
    ctx.save();
    ctx.translate(this.x, this.y - this.radius * 2 * this.scaleY - 12);

    if (!this.isBot) {
      // Clear bright "YOU" indicator for the player
      ctx.fillStyle = '#ffcc00';
      ctx.font = '900 13px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText('▼ YOU ▼', 0, 0);
    }

    ctx.restore();
  }

  // --- PROCEDURAL PINK SATIN PRINCESS BOW (Exact visual match fallback) ---
  renderProceduralPinkBow(ctx, headTopY) {
    ctx.save();
    const knotY = headTopY - 2;

    // 1. Two hanging ribbon tails (behind loops)
    const tailGrad = ctx.createLinearGradient(0, knotY, 0, knotY + 22);
    tailGrad.addColorStop(0, '#f472b6');
    tailGrad.addColorStop(0.5, '#ec4899');
    tailGrad.addColorStop(1, '#be185d');

    // Left tail
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(-4, knotY + 4);
    ctx.quadraticCurveTo(-14, knotY + 12, -16, knotY + 22);
    ctx.lineTo(-11, knotY + 19);
    ctx.lineTo(-6, knotY + 22);
    ctx.quadraticCurveTo(-7, knotY + 12, -1, knotY + 4);
    ctx.closePath();
    ctx.fill();

    // Right tail
    ctx.beginPath();
    ctx.moveTo(4, knotY + 4);
    ctx.quadraticCurveTo(14, knotY + 12, 16, knotY + 22);
    ctx.lineTo(11, knotY + 19);
    ctx.lineTo(6, knotY + 22);
    ctx.quadraticCurveTo(7, knotY + 12, 1, knotY + 4);
    ctx.closePath();
    ctx.fill();

    // 2. Left and Right large satin loops
    const loopGradLeft = ctx.createRadialGradient(-10, knotY - 6, 2, -10, knotY - 4, 16);
    loopGradLeft.addColorStop(0, '#fce7f3'); // bright specular satin highlight
    loopGradLeft.addColorStop(0.4, '#f472b6');
    loopGradLeft.addColorStop(0.85, '#db2777');
    loopGradLeft.addColorStop(1, '#9d174d');

    // Left loop
    ctx.fillStyle = loopGradLeft;
    ctx.beginPath();
    ctx.moveTo(-3, knotY);
    ctx.bezierCurveTo(-16, knotY - 18, -24, knotY - 6, -18, knotY + 2);
    ctx.bezierCurveTo(-14, knotY + 5, -6, knotY + 3, -3, knotY + 2);
    ctx.closePath();
    ctx.fill();

    // Right loop
    const loopGradRight = ctx.createRadialGradient(10, knotY - 6, 2, 10, knotY - 4, 16);
    loopGradRight.addColorStop(0, '#fce7f3');
    loopGradRight.addColorStop(0.4, '#f472b6');
    loopGradRight.addColorStop(0.85, '#db2777');
    loopGradRight.addColorStop(1, '#9d174d');

    ctx.fillStyle = loopGradRight;
    ctx.beginPath();
    ctx.moveTo(3, knotY);
    ctx.bezierCurveTo(16, knotY - 18, 24, knotY - 6, 18, knotY + 2);
    ctx.bezierCurveTo(14, knotY + 5, 6, knotY + 3, 3, knotY + 2);
    ctx.closePath();
    ctx.fill();

    // 3. Center satin knot
    const knotGrad = ctx.createLinearGradient(-4, knotY - 5, 4, knotY + 5);
    knotGrad.addColorStop(0, '#fdf2f8');
    knotGrad.addColorStop(0.5, '#ec4899');
    knotGrad.addColorStop(1, '#9d174d');
    ctx.fillStyle = knotGrad;
    ctx.beginPath();
    ctx.roundRect(-4.5, knotY - 4, 9, 8, 3);
    ctx.fill();

    // Subtle satin highlight stroke
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-11, knotY - 7, 5, -0.4, Math.PI * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(11, knotY - 7, 5, Math.PI * 0.3, Math.PI * 1.4);
    ctx.stroke();

    ctx.restore();
  }
}

// Preload Princess Bow image asset
if (typeof Image !== 'undefined') {
  Fighter.bowImage = new Image();
  Fighter.bowImage.src = 'pink_bow.png';
}
