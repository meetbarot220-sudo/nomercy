/* ============================================================
   SQUISH BRAWL - MAIN GAME ENGINE & MATCH CONTROLLER
   ============================================================ */

// Canvas roundRect polyfill for maximum cross-browser compatibility
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    if (!radii) radii = 0;
    if (typeof radii === 'number') radii = [radii, radii, radii, radii];
    const r = Array.isArray(radii) ? radii[0] : 0;
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Match States: 'TITLE', 'COUNTDOWN', 'PLAYING', 'GAME_OVER'
    this.state = 'TITLE';

    // Match configuration
    this.matchDuration = 120; // 2 minutes
    this.matchTime = this.matchDuration;
    this.countdownTimer = 3.5;

    // Fighters list
    this.fighters = [];
    this.player = null;
    this.botControllers = [];

    // Hit-stop (micro freeze frame on impact)
    this.hitStopTimer = 0;

    // Timing loop
    this.lastTime = performance.now();
    this.animationFrameId = null;

    // UI Elements
    this.initUI();
    this.initFighters();
    this.handleResize();

    window.addEventListener('resize', () => this.handleResize());

    // Start render/update loop
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  // --- INITIALIZE FIGHTERS ---
  // 🔴 Player = RED (Exclusively reserved for human player)
  // 🟢 Bot 1 = GREEN (Blaze - Aggressive)
  // 🔵 Bot 2 = BLUE (Aegis - Defensive)
  // 🟡 Bot 3 = YELLOW (Wobble - Chaotic)
  initFighters() {
    // 1. Player (Red + Golden Crown)
    this.player = new Fighter({
      id: 'player',
      name: 'Player',
      isBot: false,
      accessory: 'crown',
      personality: 'player',
      themeKey: 'player',
      x: 750,
      y: 720,
      facing: 1
    });

    // 2. Bot 1 (Blaze - Aggressive, Green + Spiky Mohawk)
    const bot1 = new Fighter({
      id: 'bot_blaze',
      name: 'Blaze',
      isBot: true,
      accessory: 'mohawk',
      personality: 'aggressive',
      themeKey: 'bot_blaze',
      x: 1050,
      y: 720,
      facing: -1
    });

    // 3. Bot 2 (Aegis - Defensive, Blue + Viking Horns)
    const bot2 = new Fighter({
      id: 'bot_aegis',
      name: 'Aegis',
      isBot: true,
      accessory: 'horns',
      personality: 'defensive',
      themeKey: 'bot_aegis',
      x: 380,
      y: 600,
      facing: 1
    });

    // 4. Bot 3 (Wobble - Chaotic, Yellow + Propeller Beanie)
    const bot3 = new Fighter({
      id: 'bot_wobble',
      name: 'Wobble',
      isBot: true,
      accessory: 'propeller',
      personality: 'chaotic',
      themeKey: 'bot_wobble',
      x: 1420,
      y: 600,
      facing: -1
    });

    this.fighters = [this.player, bot1, bot2, bot3];
    this.botControllers = [
      new BotController(bot1),
      new BotController(bot2),
      new BotController(bot3)
    ];

    this.buildFightersHUD();
  }

  // --- RESIZE CANVAS & CAMERA ---
  handleResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    window.gameCamera.resize(w, h);
  }

  // --- HIT STOP (Juicy impact freeze) ---
  triggerHitStop(ms) {
    this.hitStopTimer = ms / 1000;
  }

  // --- UI SETUP & EVENT LISTENERS ---
  initUI() {
    // Start Brawl Button
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        window.soundEngine.init();
        this.startMatch();
      });
    }

    // Play Again Button
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        window.soundEngine.init();
        this.startMatch();
      });
    }

    // Sound & Music Buttons
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const on = window.soundEngine.toggleSound();
        btnSound.textContent = on ? '🔊' : '🔇';
      });
    }

    const btnMusic = document.getElementById('btn-music');
    if (btnMusic) {
      btnMusic.addEventListener('click', () => {
        const on = window.soundEngine.toggleMusic();
        btnMusic.textContent = on ? '🎵' : '🔇';
      });
    }

    // Fullscreen Button
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  // Build HUD Fighter Status Cards
  buildFightersHUD() {
    const container = document.getElementById('fighters-hud');
    if (!container) return;
    container.innerHTML = '';

    const accessoryIcons = {
      crown: '👑',
      mohawk: '⚡',
      horns: '🛡️',
      propeller: '🌀'
    };

    this.fighters.forEach(f => {
      const card = document.createElement('div');
      card.id = `fighter-card-${f.id}`;
      card.className = `fighter-card ${!f.isBot ? 'player-card' : ''}`;
      card.style.borderColor = f.theme.cardBorder;

      card.innerHTML = `
        <div class="fighter-card-avatar">${accessoryIcons[f.accessory] || '🥊'}</div>
        <div class="fighter-card-info">
          <span class="fighter-card-name" style="color:${f.theme.cardBorder}">${f.name}</span>
          <span class="fighter-card-damage" id="card-dmg-${f.id}">0%</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Update HUD values
  updateHUD() {
    // 1. Timer
    const timerElem = document.getElementById('match-timer');
    if (timerElem) {
      const mins = Math.floor(Math.max(0, this.matchTime) / 60);
      const secs = Math.floor(Math.max(0, this.matchTime) % 60);
      timerElem.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // 2. Remaining Bots Count
    const aliveBots = this.fighters.filter(f => f.isBot && f.isAlive).length;
    const aliveElem = document.getElementById('alive-count');
    if (aliveElem) {
      aliveElem.innerHTML = `🤖 BOTS: <span style="color:#ffde59;font-weight:900;">${aliveBots}/3</span>`;
    }

    // 3. Cards Damage & Eliminated state
    this.fighters.forEach(f => {
      const card = document.getElementById(`fighter-card-${f.id}`);
      const dmgElem = document.getElementById(`card-dmg-${f.id}`);
      if (card && dmgElem) {
        if (!f.isAlive) {
          card.classList.add('eliminated');
          dmgElem.textContent = 'K.O.';
          dmgElem.classList.remove('high-danger');
        } else {
          card.classList.remove('eliminated');
          dmgElem.textContent = `${Math.round(f.damagePercentage)}%`;
          if (f.damagePercentage >= 95) {
            dmgElem.classList.add('high-danger');
          } else {
            dmgElem.classList.remove('high-danger');
          }
        }
      }
    });
  }

  // --- START / RESTART MATCH ---
  startMatch() {
    // Hide Modals
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('game-over-modal').classList.add('hidden');

    // Restore Mobile Touch Controls if on a touch device
    if (window.input && window.input.isTouchDevice) {
      const mobileControls = document.getElementById('mobile-controls');
      if (mobileControls) mobileControls.classList.remove('hidden');
    }

    // Reset systems
    window.particles.reset();
    window.powerUpManager.reset();

    // Reset Fighters to spawn points
    const spawns = [
      { x: 700, y: 720 },
      { x: 1100, y: 720 },
      { x: 380, y: 600 },
      { x: 1420, y: 600 }
    ];

    this.fighters.forEach((f, idx) => {
      const sp = spawns[idx];
      f.reset(sp.x, sp.y);
      f.facing = sp.x < 900 ? 1 : -1;
    });

    this.matchTime = this.matchDuration;
    this.countdownTimer = 3.5;
    this.state = 'COUNTDOWN';

    // Show Announcer Overlay
    const announcer = document.getElementById('announcer-overlay');
    announcer.classList.remove('hidden');

    this.updateHUD();
  }

  // --- FIGHTER ELIMINATION HANDLER ---
  // PRIORITY RULES:
  // IF PLAYER DIES -> GAME OVER IMMEDIATELY (YOU LOST)
  // ELSE IF ALL BOTS DIE -> PLAYER WINS IMMEDIATELY (YOU WIN!)
  // ELSE -> CONTINUE MATCH
  onFighterEliminated(fighter) {
    this.updateHUD();

    // 1. IF PLAYER DIES: IMMEDIATELY END MATCH!
    if (!fighter.isBot) {
      this.endMatch('PLAYER_LOST');
      return;
    }

    // 2. A BOT DIED: Check if all 3 bots are eliminated
    const aliveBots = this.fighters.filter(f => f.isBot && f.isAlive);
    const playerAlive = this.player && this.player.isAlive;

    if (aliveBots.length === 0 && playerAlive) {
      this.endMatch('PLAYER_WON');
    }
  }

  // --- END MATCH ---
  endMatch(outcome) {
    this.state = 'GAME_OVER';

    // Reset and freeze all input states
    if (window.input) {
      window.input.reset();
    }

    // Immediately hide and disable mobile touch controls upon death
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
      mobileControls.classList.add('hidden');
    }

    const modal = document.getElementById('game-over-modal');
    const trophy = document.getElementById('modal-trophy');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const statsGrid = document.getElementById('modal-stats');

    if (outcome === 'PLAYER_WON') {
      trophy.textContent = '👑';
      title.textContent = 'YOU WIN!';
      title.style.color = '#ffde59';
      subtitle.textContent = 'All AI bots were eliminated! You are the champion!';
      window.soundEngine.playVictory();
    } else {
      // PLAYER_LOST or Timeout
      trophy.textContent = '💀';
      title.textContent = 'YOU LOST';
      title.style.color = '#ff3344';
      subtitle.textContent = 'You fell from the platform arena! Better luck next round!';
      window.soundEngine.playElimination();
    }

    // Populate player match statistics
    statsGrid.innerHTML = `
      <div class="stat-item">
        <div class="stat-val">${this.player.kills}</div>
        <div class="stat-lbl">Bots Eliminated</div>
      </div>
      <div class="stat-item">
        <div class="stat-val">${Math.round(this.player.damageDealt)}%</div>
        <div class="stat-lbl">Damage Dealt</div>
      </div>
      <div class="stat-item">
        <div class="stat-val">${Math.round(this.player.survivalTime)}s</div>
        <div class="stat-lbl">Time Survived</div>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  // --- MAIN GAME LOOP ---
  loop(currentTime) {
    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap delta time to prevent physics jumping when tabbed out
    const dt = Math.min(rawDt, 0.05);

    this.update(dt);
    this.render();

    window.input.endFrame();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  // --- UPDATE ---
  update(dt) {
    // 1. Handle Start triggers if in Title or Game Over
    if (window.input.isJustPressed('start')) {
      if (this.state === 'TITLE' || this.state === 'GAME_OVER') {
        window.soundEngine.init();
        this.startMatch();
        return;
      }
    }

    // When Game is Over, freeze all gameplay immediately!
    if (this.state === 'GAME_OVER') {
      return;
    }

    // 2. Hit-Stop check
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return; // Freeze game physics during hitstop frame
    }

    // 3. Match Countdown Phase
    if (this.state === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      const announcer = document.getElementById('announcer-text');

      if (this.countdownTimer > 2.5) {
        if (announcer.textContent !== '3') {
          announcer.textContent = '3';
          window.soundEngine.playBeep(false);
        }
      } else if (this.countdownTimer > 1.5) {
        if (announcer.textContent !== '2') {
          announcer.textContent = '2';
          window.soundEngine.playBeep(false);
        }
      } else if (this.countdownTimer > 0.5) {
        if (announcer.textContent !== '1') {
          announcer.textContent = '1';
          window.soundEngine.playBeep(false);
        }
      } else if (this.countdownTimer > 0) {
        if (announcer.textContent !== 'BRAWL!') {
          announcer.textContent = 'BRAWL!';
          announcer.style.color = '#ff3344';
          window.soundEngine.playBeep(true);
        }
      } else {
        document.getElementById('announcer-overlay').classList.add('hidden');
        this.state = 'PLAYING';
      }
    }

    // 4. Update Match Timer
    if (this.state === 'PLAYING') {
      this.matchTime -= dt;
      if (this.matchTime <= 0) {
        this.matchTime = 0;
        // Find highest health / lowest damage survivor
        const alive = this.fighters.filter(f => f.isAlive);
        alive.sort((a, b) => a.damagePercentage - b.damagePercentage);
        this.endMatch(alive.length > 0 ? alive[0] : null);
      }
    }

    // 5. Arena & Environment update
    window.arena.update(dt);

    // 6. Player Input Processing
    if (this.player && this.player.isAlive && (this.state === 'PLAYING' || this.state === 'COUNTDOWN')) {
      let moveDir = 0;
      if (window.input.isDown('left')) moveDir -= 1;
      if (window.input.isDown('right')) moveDir += 1;

      this.player.move(moveDir, dt);

      if (window.input.isJustPressed('jump')) {
        this.player.jump();
      }

      if (window.input.isDown('down')) {
        this.player.dropDown();
      }

      if (this.state === 'PLAYING') {
        if (window.input.isJustPressed('attack')) {
          this.player.attack();
        }
        if (window.input.isJustPressed('dash')) {
          this.player.dash();
        }
      }
    }

    // 7. Bot AI Update
    if (this.state === 'PLAYING') {
      this.botControllers.forEach(ctrl => ctrl.update(dt, this.fighters, window.arena));
    }

    // 8. Update Fighters Physics
    this.fighters.forEach(f => f.update(dt, window.arena));

    // 9. Combat Hitboxes & Stomp Interactions
    if (this.state === 'PLAYING') {
      this.checkCombatInteractions();
    }

    // 10. Power-ups update & pickup detection
    if (this.state === 'PLAYING') {
      window.powerUpManager.update(dt, window.arena);
      this.fighters.forEach(f => window.powerUpManager.checkPickup(f));
    }

    // 11. Particles & Floating Text update
    window.particles.update(dt);

    // 12. Camera tracking
    window.gameCamera.update(dt, this.player, this.fighters, window.arena);

    // 13. HUD update
    this.updateHUD();
  }

  // --- COMBAT & STOMP INTERACTION CHECK ---
  checkCombatInteractions() {
    const alive = this.fighters.filter(f => f.isAlive);

    for (let i = 0; i < alive.length; i++) {
      const f1 = alive[i];

      for (let j = 0; j < alive.length; j++) {
        if (i === j) continue;
        const f2 = alive[j];

        // 1. HEAD STOMP CHECK (f1 jumps/falls onto f2)
        if (f1.vy > 80 && f1.y < f2.y && f1.y >= f2.y - f2.radius * 2) {
          if (Math.abs(f1.x - f2.x) < (f1.radius + f2.radius) * 0.75) {
            f1.stomp(f2);
            continue;
          }
        }

        // 2. ATTACK / PUNCH HITBOX CHECK
        if (f1.isAttacking && !f1.attackHitFighters.has(f2)) {
          const fistReach = f1.radius + 36;
          const punchY = f1.y - f1.radius;
          const targetCenterY = f2.y - f2.radius;

          const dx = f2.x - f1.x;
          const dy = targetCenterY - punchY;

          // Target must be in facing direction
          const isInFront = (f1.facing > 0 && dx > 0) || (f1.facing < 0 && dx < 0);

          if (isInFront && Math.abs(dx) < fistReach + f2.radius && Math.abs(dy) < 32) {
            f1.attackHitFighters.add(f2);

            // Angle of launch (mostly horizontal, slightly up)
            const angle = f1.facing > 0 ? -0.32 : Math.PI + 0.32;
            const baseDamage = 14;
            const baseKnockback = 340;

            f2.takeHit(f1, baseDamage, baseKnockback, angle);
          }
        }

        // 3. DASH RAM HITBOX CHECK
        if (f1.isDashing && f2.invulnerableTimer <= 0) {
          const dist = Math.hypot(f1.x - f2.x, (f1.y - f1.radius) - (f2.y - f2.radius));
          if (dist < f1.radius + f2.radius) {
            const angle = f1.facing > 0 ? -0.25 : Math.PI + 0.25;
            f2.takeHit(f1, 10, 420, angle);
            f1.isDashing = false; // end dash on hit
          }
        }
      }
    }
  }

  // --- RENDER ---
  render() {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Clear Canvas
    ctx.clearRect(0, 0, w, h);

    // Apply smooth dynamic camera transformation
    window.gameCamera.begin(ctx);

    // 1. Background Arena & Stadium Spotlights
    window.arena.renderBackground(ctx);

    // 2. Platforms & Spring Pads
    window.arena.renderPlatforms(ctx);

    // 3. Floating Power-up Items
    window.powerUpManager.render(ctx);

    // 4. Fighters (Ordered by Y for proper 2.5D layering)
    const sortedFighters = [...this.fighters].sort((a, b) => a.y - b.y);
    sortedFighters.forEach(f => f.render(ctx));

    // 5. Particles & Floating Combat Texts
    window.particles.render(ctx);

    window.gameCamera.end(ctx);
  }
}

// Launch Game on Window Load
window.addEventListener('load', () => {
  window.gameEngine = new GameEngine();
});
