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

    // Match States: 'WAITING_START', 'COUNTDOWN', 'PLAYING', 'GAME_OVER'
    this.state = 'WAITING_START';

    // Match configuration
    this.matchDuration = 90; // 90 seconds (1:30)
    this.matchTime = this.matchDuration;
    this.countdownTimer = 3.0;
    this.brawlDisplayTimer = 0;

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

    // Mountain pixel-art background image
    this.bgImage = new Image();
    this.bgImage.src = 'mountain_bg.png';

    window.addEventListener('resize', () => this.handleResize());
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.handleResize());
      window.visualViewport.addEventListener('scroll', () => this.handleResize());
    }

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

    // 2. Bot 1 (Blaze - Aggressive, Green Bot + Pink Princess Bow)
    const bot1 = new Fighter({
      id: 'bot_blaze',
      name: 'Blaze',
      isBot: true,
      accessory: 'princess_bow', // Pink satin princess bow
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
      x: 900,
      y: 520,
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
      x: 900,
      y: 340,
      facing: -1
    });

    this.fighters = [this.player, bot1, bot2, bot3];
    this.botControllers = [
      new BotController(bot1),
      new BotController(bot2),
      new BotController(bot3)
    ];

    this.pendingSpawnBots = [];
    this.buildFightersHUD();
  }

  // --- SAFE BOT SPAWN LOCATION FINDER ---
  // Ensures bots spawn upright, solidly ON TOP of assigned platforms,
  // never underneath/inside, never near jump pads, and never overlapping other fighters.
  findSafeSpawnLocation(fighter, placedFighters = []) {
    const candidatePlatSlots = [
      { platId: 'high_center', relX: 0.5 },     // High ground center
      { platId: 'high_center', relX: 0.22 },    // High ground left
      { platId: 'high_center', relX: 0.78 },    // High ground right
      { platId: 'apex', relX: 0.5 },            // Apex middle top platform
      { platId: 'mid_left', relX: 0.5 },        // Mid-left blue platform
      { platId: 'mid_right', relX: 0.5 },       // Mid-right blue platform
      { platId: 'main', relX: 0.38 },           // Main stage mid-left
      { platId: 'main', relX: 0.62 },           // Main stage mid-right
      { platId: 'main', relX: 0.22 },           // Main stage left (clear of pad)
      { platId: 'main', relX: 0.78 },           // Main stage right (clear of pad)
      { platId: 'top_moving_left', relX: 0.5 }, // Top moving left
      { platId: 'top_moving_right', relX: 0.5 },// Top moving right
      { platId: 'low_left', relX: 0.65 },       // Low-left island (clear of recovery pad)
      { platId: 'low_right', relX: 0.35 }       // Low-right island (clear of recovery pad)
    ];

    const springPads = (window.arena && window.arena.springPads) ? window.arena.springPads : [];
    const minPlayerDistance = 180;
    const minOtherFighterDistance = 110;
    const padSafetyMargin = 45;

    for (const slot of candidatePlatSlots) {
      if (!window.arena || !window.arena.platforms) continue;
      const plat = window.arena.platforms.find(p => p.id === slot.platId);
      if (!plat) continue;

      // Calculate exact surface position on top of platform
      const spotX = plat.x + plat.w * slot.relX;
      const spotY = plat.y; // Exactly on platform top surface

      // 1. Check against all jumping pads
      let nearPad = false;
      for (const pad of springPads) {
        const padLeft = pad.x - padSafetyMargin;
        const padRight = pad.x + pad.w + padSafetyMargin;
        const padTop = pad.y - 35;
        const padBottom = pad.y + pad.h + 25;

        if (spotX >= padLeft && spotX <= padRight && spotY >= padTop && spotY <= padBottom) {
          nearPad = true;
          break;
        }
      }
      if (nearPad) continue;

      // 2. Check player position & safe distance
      if (this.player && this.player.isAlive && fighter !== this.player) {
        const distToPlayer = Math.hypot(spotX - this.player.x, spotY - this.player.y);
        if (distToPlayer < minPlayerDistance) {
          continue;
        }
      }

      // 3. Check distance to already placed/spawned fighters
      let tooCloseToOther = false;
      for (const other of placedFighters) {
        if (!other || !other.isAlive || other === fighter) continue;
        const dist = Math.hypot(spotX - other.x, spotY - other.y);
        if (dist < minOtherFighterDistance) {
          tooCloseToOther = true;
          break;
        }
      }
      if (tooCloseToOther) continue;

      // Safe location found directly on platform surface!
      return { x: spotX, y: spotY, facing: spotX < 900 ? 1 : -1, plat: plat };
    }

    return null;
  }

  // --- RESIZE CANVAS & CAMERA ---
  handleResize() {
    const vv = window.visualViewport;
    const w = Math.round(vv ? vv.width : window.innerWidth);
    const h = Math.round(vv ? vv.height : window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
    document.documentElement.style.setProperty('--vw', `${w * 0.01}px`);

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
    // Tap or Click Anywhere to Start Listener (Desktop click/keyboard + Mobile touch)
    const handleGlobalStart = (e) => {
      if (this.state !== 'WAITING_START' && this.state !== 'TITLE') return;

      // Don't intercept sound button clicks
      if (e && e.target && (e.target.closest('#btn-sound') || e.target.closest('#btn-music'))) return;

      if (e && e.cancelable) {
        e.preventDefault();
      }
      if (e) {
        e.stopPropagation();
      }

      window.soundEngine.init();

      // Reset input immediately so the start click/tap/keypress never triggers a punch or jump
      if (window.input) {
        window.input.reset();
      }

      this.startMatch();
    };

    const tapHint = document.getElementById('tap-to-start-hint');
    if (tapHint) {
      tapHint.addEventListener('pointerdown', handleGlobalStart);
    }
    window.addEventListener('pointerdown', (e) => {
      if (this.state === 'WAITING_START' || this.state === 'TITLE') {
        handleGlobalStart(e);
      }
    });
    window.addEventListener('keydown', (e) => {
      if (this.state === 'WAITING_START' || this.state === 'TITLE') {
        handleGlobalStart(e);
      }
    });

    // Sound & Music Buttons
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = window.soundEngine.toggleSound();
        btnSound.textContent = on ? '🔊' : '🔇';
      });
    }

    const btnMusic = document.getElementById('btn-music');
    if (btnMusic) {
      btnMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = window.soundEngine.toggleMusic();
        btnMusic.textContent = on ? '🎵' : '🔇';
      });
    }
  }

  // Build HUD Fighter Status Cards
  buildFightersHUD() {
    this.updateHUD();
  }

  // Update HUD values (Show ONLY: MY SCORE, TIME, TIME SURVIVED, and Bot Count)
  updateHUD() {
    // 1. MY SCORE: Player's current score
    const scoreElem = document.getElementById('hud-my-score');
    if (scoreElem) {
      scoreElem.textContent = this.player ? (this.player.score || 0) : 0;
    }

    // 2. TIME: Remaining match time (90s countdown)
    const timerElem = document.getElementById('match-timer');
    if (timerElem) {
      const mins = Math.floor(Math.max(0, this.matchTime) / 60);
      const secs = Math.floor(Math.max(0, this.matchTime) % 60);
      timerElem.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // 3. TIME SURVIVED: Total time player survived
    const survivedElem = document.getElementById('hud-time-survived');
    if (survivedElem) {
      const totalSecs = Math.floor(this.player ? this.player.survivalTime : 0);
      const sMins = Math.floor(totalSecs / 60);
      const sSecs = totalSecs % 60;
      survivedElem.textContent = `${sMins.toString().padStart(2, '0')}:${sSecs.toString().padStart(2, '0')}`;
    }

    // 4. Bot Count Indicator
    const aliveBots = this.fighters.filter(f => f.isBot && f.isAlive).length;
    const aliveElem = document.getElementById('alive-count');
    if (aliveElem) {
      aliveElem.innerHTML = `BOTS: <span style="color:#ffde59;font-weight:900;">${aliveBots}/3</span>`;
    }
  }

  // --- START / RESTART MATCH ---
  startMatch() {
    // Hide Modals & Start Hint
    const tapHint = document.getElementById('tap-to-start-hint');
    if (tapHint) tapHint.classList.add('hidden');
    const titleScreen = document.getElementById('title-screen');
    if (titleScreen) titleScreen.classList.add('hidden');
    document.getElementById('game-over-modal').classList.add('hidden');
    document.body.classList.remove('game-over');

    if (this.killNotifTimeout) {
      clearTimeout(this.killNotifTimeout);
    }
    const notif = document.getElementById('kill-notification');
    if (notif) notif.classList.add('hidden');

    // Restore Mobile Touch Controls if on a touch device
    if (window.input && window.input.isTouchDevice) {
      const mobileControls = document.getElementById('mobile-controls');
      if (mobileControls) mobileControls.classList.remove('hidden');
    }

    // Reset systems
    window.particles.reset();
    window.powerUpManager.reset();
    this.pendingSpawnBots = [];

    // 1. Reset Player to safe main stage spawn
    const mainPlat = window.arena.platforms.find(p => p.id === 'main');
    this.player.reset(750, mainPlat ? mainPlat.y : 720);
    this.player.facing = 1;
    this.player.onGround = true;
    this.player.currentPlatform = mainPlat;
    this.player.vx = 0;
    this.player.vy = 0;

    // 2. Spawn Bots safely (checks player distance, jump pads, no overlaps, solid platform)
    const placedFighters = [this.player];
    const bots = this.fighters.filter(f => f.isBot);

    for (const bot of bots) {
      const safeSpot = this.findSafeSpawnLocation(bot, placedFighters);
      if (safeSpot) {
        bot.reset(safeSpot.x, safeSpot.y);
        bot.facing = safeSpot.facing;
        bot.onGround = true;
        bot.currentPlatform = safeSpot.plat || null;
        bot.vx = 0;
        bot.vy = 0;
        placedFighters.push(bot);
      } else {
        // Delay spawning until safe location opens up
        bot.isAlive = false;
        this.pendingSpawnBots.push(bot);
      }
    }

    this.matchTime = this.matchDuration;
    this.countdownTimer = 3.0; // 3 -> 2 -> 1 -> BRAWL!
    this.brawlDisplayTimer = 0;
    this.state = 'COUNTDOWN';

    // Show Announcer Overlay with 3
    const announcer = document.getElementById('announcer-overlay');
    const announcerText = document.getElementById('announcer-text');
    if (announcer) announcer.classList.remove('hidden');
    if (announcerText) {
      announcerText.textContent = '3';
      announcerText.style.color = '#ffffff';
    }

    this.updateHUD();
  }

  // --- FIGHTER ELIMINATION HANDLER ---
  onFighterEliminated(fighter) {
    // 1. IF PLAYER DIES: IMMEDIATELY END MATCH (Player fell out of arena)
    if (!fighter.isBot) {
      this.updateHUD();
      this.endMatch('PLAYER_FALL_OUT');
      return;
    }

    // 2. A BOT DIED: Award +500 score for every bot eliminated (exactly once per bot)
    if (fighter.isBot && !fighter.killPointsAwarded) {
      fighter.killPointsAwarded = true;
      if (this.player) {
        this.player.killScore = (this.player.killScore || 0) + 500;
        this.player.score = (this.player.fistScore || 0) + (this.player.squeezeScore || 0) + this.player.killScore;
        window.particles.spawnCombatText(
          this.player.x,
          this.player.y - 55,
          '+500 KILL!',
          '#ffde59',
          28
        );
      }
    }

    // Update HUD immediately so the +500 points show up right away
    this.updateHUD();

    // Check if player scored this kill -> Show temporary "1 KILL", "2 KILLS", etc.
    if (fighter.lastAttacker && !fighter.lastAttacker.isBot) {
      const kills = this.player.kills;
      const killText = kills === 1 ? '1 KILL' : `${kills} KILLS`;
      this.showKillNotification(killText);
    }

    // 3. Check if all 3 bots are eliminated
    const aliveBots = this.fighters.filter(f => f.isBot && f.isAlive);
    const playerAlive = this.player && this.player.isAlive;

    if (aliveBots.length === 0 && playerAlive) {
      this.endMatch('PLAYER_WON');
    }
  }

  // Temporary kill notification (appears for ~1s after player kills an enemy, then fades)
  showKillNotification(text) {
    const notif = document.getElementById('kill-notification');
    const killText = document.getElementById('kill-text');
    if (!notif || !killText) return;

    killText.textContent = text;
    notif.classList.remove('hidden');

    if (this.killNotifTimeout) {
      clearTimeout(this.killNotifTimeout);
    }

    this.killNotifTimeout = setTimeout(() => {
      notif.classList.add('hidden');
    }, 1000);
  }

  // --- END MATCH ---
  endMatch(outcome) {
    this.state = 'GAME_OVER';
    document.body.classList.add('game-over');

    // Reset and freeze all input states
    if (window.input) {
      window.input.reset();
    }

    // Immediately hide and disable mobile touch controls upon game over
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
      mobileControls.classList.add('hidden');
    }

    if (this.killNotifTimeout) {
      clearTimeout(this.killNotifTimeout);
    }
    const notif = document.getElementById('kill-notification');
    if (notif) notif.classList.add('hidden');

    const modal = document.getElementById('game-over-modal');
    const trophy = document.getElementById('modal-trophy');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const fistScoreEl = document.getElementById('modal-fist-score');
    const squeezeScoreEl = document.getElementById('modal-squeeze-score');
    const killScoreEl = document.getElementById('modal-kill-score');
    const totalScoreEl = document.getElementById('modal-total-score');
    const survivalEl = document.getElementById('modal-survival');

    const fistScore = this.player ? (this.player.fistScore || 0) : 0;
    const squeezeScore = this.player ? (this.player.squeezeScore || 0) : 0;
    const killScore = this.player ? (this.player.killScore || 0) : 0;
    const totalScore = fistScore + squeezeScore + killScore;
    const finalSurvival = Math.round(this.player ? this.player.survivalTime : 0);

    // Populate score breakdown: FIST SCORE, SQUEEZE SCORE, KILL SCORE, TOTAL SCORE
    if (fistScoreEl) fistScoreEl.textContent = fistScore;
    if (squeezeScoreEl) squeezeScoreEl.textContent = squeezeScore;
    if (killScoreEl) killScoreEl.textContent = killScore;
    if (totalScoreEl) totalScoreEl.textContent = totalScore;
    if (survivalEl) survivalEl.textContent = `TIME SURVIVED: ${finalSurvival}s`;

    // Determine final WIN / LOSE result (displayed AFTER score breakdown)
    let isWin = false;
    if (outcome === 'PLAYER_WON') {
      isWin = true;
      if (trophy) trophy.textContent = '👑';
      if (subtitle) subtitle.textContent = `All AI bots were eliminated!`;
      window.soundEngine.playVictory();
    } else if (outcome === 'TIMEOUT') {
      isWin = totalScore > 0;
      if (isWin) {
        if (trophy) trophy.textContent = '🏆';
        if (subtitle) subtitle.textContent = `Time's up! Victory with ${totalScore} points!`;
        window.soundEngine.playVictory();
      } else {
        if (trophy) trophy.textContent = '⏱️';
        if (subtitle) subtitle.textContent = "Time's up! Survived full 90s, but scored 0 points.";
        window.soundEngine.playElimination();
      }
    } else {
      // outcome === 'PLAYER_FALL_OUT'
      isWin = false;
      if (trophy) trophy.textContent = '💀';
      if (subtitle) subtitle.textContent = 'You fell from the platform arena!';
      window.soundEngine.playElimination();
    }

    if (title) {
      title.textContent = isWin ? 'YOU WIN' : 'YOU LOSE';
      title.style.color = isWin ? '#ffde59' : '#ff3344';
    }

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
    // 1. Handle Start triggers if in Title
    if (window.input.isJustPressed('start')) {
      if (this.state === 'TITLE') {
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

    // 3. Match Countdown Phase (3 -> 2 -> 1 -> BRAWL!)
    if (this.state === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      const announcer = document.getElementById('announcer-text');

      if (this.countdownTimer > 2.0) {
        if (announcer && announcer.textContent !== '3') {
          announcer.textContent = '3';
          announcer.style.color = '#ffffff';
          window.soundEngine.playBeep(false);
        }
      } else if (this.countdownTimer > 1.0) {
        if (announcer && announcer.textContent !== '2') {
          announcer.textContent = '2';
          announcer.style.color = '#ffffff';
          window.soundEngine.playBeep(false);
        }
      } else if (this.countdownTimer > 0) {
        if (announcer && announcer.textContent !== '1') {
          announcer.textContent = '1';
          announcer.style.color = '#ffffff';
          window.soundEngine.playBeep(false);
        }
      } else {
        // Countdown finished: Display "BRAWL!"
        if (announcer) {
          announcer.textContent = 'BRAWL!';
          announcer.style.color = '#ff2a4b';
        }
        window.soundEngine.playBeep(true);

        // Immediately unlock player controls, unlock bot AI, and start match normally!
        this.state = 'PLAYING';
        this.brawlDisplayTimer = 0.85; // BRAWL! displays for 0.85s, then cleanly fades out
      }
    }

    // Auto-hide announcer overlay after BRAWL! duration finishes
    if (this.brawlDisplayTimer > 0) {
      this.brawlDisplayTimer -= dt;
      if (this.brawlDisplayTimer <= 0) {
        const announcerOverlay = document.getElementById('announcer-overlay');
        if (announcerOverlay) {
          announcerOverlay.classList.add('hidden');
        }
      }
    }

    // 4. Update Match Timer (90-second match duration)
    if (this.state === 'PLAYING') {
      this.matchTime -= dt;
      if (this.matchTime <= 0) {
        this.matchTime = 0;
        this.endMatch('TIMEOUT');
      }
    }

    // 5. Arena & Environment update
    window.arena.update(dt);

    // 6. Player Input Processing (Frozen during countdown, strictly active only during PLAYING)
    if (this.player && this.player.isAlive && this.state === 'PLAYING') {
      let moveDir = 0;
      if (window.input.isDown('left')) moveDir -= 1;
      if (window.input.isDown('right')) moveDir += 1;

      this.player.move(moveDir, dt);

      if (window.input.isJustPressed('jump') || (window.input.isDown('jump') && this.player.onGround && this.player.vy >= 0)) {
        this.player.jump();
      }

      if (window.input.isJustPressed('attack') || (window.input.isDown('attack') && this.player.attackCooldown <= 0)) {
        this.player.attack();
      }
    }

    // 7. Bot AI Update (Frozen during countdown, strictly active only during PLAYING)
    if (this.state === 'PLAYING') {
      this.botControllers.forEach(ctrl => ctrl.update(dt, this.fighters, window.arena));
    }

    // 7b. Process any bots with delayed safe spawning
    if (this.pendingSpawnBots && this.pendingSpawnBots.length > 0) {
      const remainingPending = [];
      const placed = this.fighters.filter(f => f.isAlive);
      for (const bot of this.pendingSpawnBots) {
        const spot = this.findSafeSpawnLocation(bot, placed);
        if (spot) {
          bot.reset(spot.x, spot.y);
          bot.facing = spot.facing;
          bot.onGround = true;
          bot.currentPlatform = spot.plat || null;
          bot.vx = 0;
          bot.vy = 0;
          placed.push(bot);
        } else {
          remainingPending.push(bot);
        }
      }
      this.pendingSpawnBots = remainingPending;
    }

    // 8. Update Fighters Physics
    if (this.state === 'COUNTDOWN') {
      // Keep all fighters completely stationary, upright and solidly on their platforms
      this.fighters.forEach(f => {
        if (f.currentPlatform) {
          f.y = f.currentPlatform.y;
          f.onGround = true;
          if (f.currentPlatform.vx) {
            f.x += f.currentPlatform.vx * dt;
          }
        }
        f.vx = 0;
        f.vy = 0;
        f.scaleX = 1.0;
        f.scaleY = 1.0;
      });
    } else {
      this.fighters.forEach(f => f.update(dt, window.arena));
    }

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

            const hitSuccess = f2.takeHit(f1, baseDamage, baseKnockback, angle);
            // Every successful fist punch that lands on an opponent = +100 score!
            if (hitSuccess !== false) {
              f1.fistScore = (f1.fistScore || 0) + 100;
              f1.score = f1.fistScore + (f1.squeezeScore || 0) + (f1.killScore || 0);
              if (!f1.isBot) {
                window.particles.spawnCombatText(f2.x, f2.y - 28, '+100 FIST', '#ffde59', 24);
                this.updateHUD();
              }
            }
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

    // 1. Render Full-Screen Mountain Pixel-Art Wallpaper
    // Proportional cover, no distortion or blur, crisp pixelated rendering
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      const imgW = this.bgImage.naturalWidth;
      const imgH = this.bgImage.naturalHeight;
      const scale = Math.max(w / imgW, h / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = (w - drawW) / 2;
      const drawY = h - drawH; // bottom-anchored so dark forest and mountains sit behind stage
      ctx.drawImage(this.bgImage, drawX, drawY, drawW, drawH);
    }

    // Apply smooth dynamic camera transformation
    window.gameCamera.begin(ctx);

    // 2. Under-Platform Ancient Foundations & Hanging Vines
    window.arena.renderBackground(ctx);

    // 3. Platforms & Spring Pads
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

// Launch Game robustly
function initGame() {
  if (!window.gameEngine) {
    window.gameEngine = new GameEngine();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
  window.addEventListener('load', initGame);
} else {
  initGame();
}
