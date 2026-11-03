/* ============================================================
   SQUISH BRAWL - ARENA & PLATFORMS SYSTEM (CARTOON NATURE ENVIRONMENT)
   Bright cheerful cartoon nature landscape inspired by vector platform art:
   Layered blue sky with soft arched bands, giant billowy cartoon clouds,
   soft rolling hills, stylized lollipop trees, grass tufts, and pebbles.
   NO watermarks, NO text, NO logos.
   ============================================================ */

class Arena {
  constructor() {
    this.width = 1800;
    this.height = 1100;

    // Blast zones (character eliminated if they exceed these)
    this.blastZones = {
      left: -200,
      right: 2000,
      top: -450,
      bottom: 1250
    };

    // Platform definitions
    // type: 'solid' (cannot pass through) or 'jumpthrough' (can jump up through, drop down with S)
    this.platforms = [
      // 1. Central Main Stage (1st Platform - Wide fighting floor)
      { id: 'main', x: 550, y: 720, w: 700, h: 48, type: 'solid', style: 'main' },

      // 2. High Ground Central Platform (2nd Platform) - Holds Central Jump Pad!
      { id: 'high_center', x: 700, y: 520, w: 400, h: 22, type: 'jumpthrough', style: 'garden_wood' },

      // 3. Horizontal Sliding Platform - LEFT side of 1st Platform
      {
        id: 'moving_left',
        x: 410,
        baseX: 410,
        y: 710,
        w: 150,
        h: 22,
        type: 'jumpthrough',
        style: 'moving',
        moveType: 'horizontal',
        range: 110,
        speed: 1.1,
        time: 0,
        vx: 0,
        vy: 0
      },

      // 4. Horizontal Sliding Platform - RIGHT side of 1st Platform
      {
        id: 'moving_right',
        x: 1390,
        baseX: 1390,
        y: 710,
        w: 150,
        h: 22,
        type: 'jumpthrough',
        style: 'moving',
        moveType: 'horizontal',
        range: 110,
        speed: 1.1,
        time: Math.PI,
        vx: 0,
        vy: 0
      },

      // 5. Vertical Lift - Apex Connection (Connects floating 2nd platform 520 to Apex Upper Arena 340)
      {
        id: 'lift_apex',
        x: 600,
        y: 520,
        w: 140,
        h: 20,
        type: 'jumpthrough',
        style: 'lift',
        moveType: 'lift',
        yBottom: 520,
        yTop: 340,
        cycleTime: 6.5,
        pauseTime: 1.0,
        timer: 0.5,
        vx: 0,
        vy: 0
      },

      // 6. Highest Apex Perch (Upper Arena)
      { id: 'apex', x: 800, y: 340, w: 200, h: 18, type: 'jumpthrough', style: 'garden_wood' },

      // 7. Left Mid Platform
      { id: 'mid_left', x: 230, y: 600, w: 220, h: 22, type: 'jumpthrough', style: 'garden_wood' },

      // 8. Right Mid Platform
      { id: 'mid_right', x: 1350, y: 600, w: 220, h: 22, type: 'jumpthrough', style: 'garden_wood' },

      // 9. Left Low Recovery Island (Solid narrow)
      { id: 'low_left', x: 120, y: 820, w: 220, h: 36, type: 'solid', style: 'island' },

      // 10. Right Low Recovery Island (Solid narrow)
      { id: 'low_right', x: 1460, y: 820, w: 220, h: 36, type: 'solid', style: 'island' }
    ];

    // Jump / Spring Pads:
    // - Central Jump Pad directly on top of the floating 2nd Platform (high_center) to launch into upper arena!
    // - Moves together with the floating 2nd platform.
    // - Side recovery spring pads on low islands
    this.springPads = [
      // 2nd Platform Jump Pad (Directly on top of floating high_center platform, locked to it)
      { id: 'spring_center', platId: 'high_center', relX: 0.5, w: 52, h: 14, bounceVy: -920, animTime: 0, x: 874, y: 508 },
      // Left Recovery Jump Pad
      { id: 'spring_left', platId: 'low_left', relX: 0.35, w: 50, h: 14, bounceVy: -1050, animTime: 0, x: 180, y: 808 },
      // Right Recovery Jump Pad
      { id: 'spring_right', platId: 'low_right', relX: 0.65, w: 50, h: 14, bounceVy: -1050, animTime: 0, x: 1570, y: 808 }
    ];

    // Power-up tactical spawn coordinates
    this.powerUpSpawns = [
      { x: 900, y: 310 },  // Apex high
      { x: 900, y: 685 },  // Main stage center
      { x: 375, y: 565 },  // Mid left
      { x: 1425, y: 565 }  // Mid right
    ];

    window.powerUpManager.setSpawnPoints(this.powerUpSpawns);

    // ============================================================
    // CARTOON NATURE BACKGROUND PROCEDURAL DATA (Layered Parallax)
    // ============================================================
    this.time = 0;

    // 1. Giant Soft Billowy Cartoon Clouds (Layer 1 - Reference inspired)
    this.clouds = [
      {
        x: -220,
        y: 120,
        scale: 1.2,
        speed: 6,
        puffs: [
          { ox: 0, oy: 0, r: 75 },
          { ox: 65, oy: -35, r: 95 },
          { ox: 145, oy: -20, r: 80 },
          { ox: 215, oy: 15, r: 65 },
          { ox: -65, oy: 25, r: 55 }
        ]
      },
      {
        x: 380,
        y: 80,
        scale: 1.35,
        speed: 8,
        puffs: [
          { ox: 0, oy: 10, r: 85 },
          { ox: 80, oy: -40, r: 110 },
          { ox: 175, oy: -25, r: 90 },
          { ox: 255, oy: 15, r: 70 },
          { ox: -75, oy: 30, r: 60 }
        ]
      },
      {
        x: 1050,
        y: 140,
        scale: 1.15,
        speed: 5.5,
        puffs: [
          { ox: 0, oy: 0, r: 70 },
          { ox: 60, oy: -30, r: 90 },
          { ox: 135, oy: -15, r: 75 },
          { ox: 195, oy: 20, r: 60 }
        ]
      },
      {
        x: 1650,
        y: 90,
        scale: 1.3,
        speed: 7.5,
        puffs: [
          { ox: 0, oy: 10, r: 80 },
          { ox: 75, oy: -45, r: 105 },
          { ox: 165, oy: -20, r: 85 },
          { ox: 240, oy: 20, r: 65 },
          { ox: -70, oy: 25, r: 55 }
        ]
      },
      {
        x: 2300,
        y: 130,
        scale: 1.2,
        speed: 7,
        puffs: [
          { ox: 0, oy: 0, r: 75 },
          { ox: 70, oy: -35, r: 95 },
          { ox: 150, oy: -15, r: 80 }
        ]
      }
    ];

    // 2. Distant Soft Blue / Periwinkle Cartoon Mountains (Layer 2)
    this.distantMountains = [
      { x: -500, w: 600, h: 320, cx: -200, cy: 500 },
      { x: -50,  w: 700, h: 380, cx: 300,  cy: 480 },
      { x: 500,  w: 750, h: 350, cx: 875,  cy: 490 },
      { x: 1100, w: 700, h: 400, cx: 1450, cy: 470 },
      { x: 1650, w: 650, h: 330, cx: 1975, cy: 510 },
      { x: 2150, w: 650, h: 360, cx: 2475, cy: 490 }
    ];

    // 3. Mid-Distance Rolling Pastel Hills (Layer 3)
    this.midHills = [
      { cx: -300, cy: 560, rx: 500, ry: 210, color: '#78c6a3' },
      { cx: 240,  cy: 530, rx: 540, ry: 230, color: '#68b993' },
      { cx: 820,  cy: 570, rx: 580, ry: 240, color: '#74c49f' },
      { cx: 1380, cy: 535, rx: 520, ry: 220, color: '#65b790' },
      { cx: 1920, cy: 565, rx: 560, ry: 230, color: '#71c09b' },
      { cx: 2480, cy: 540, rx: 500, ry: 210, color: '#68b993' }
    ];

    // 4. Nearer Cartoon Rolling Hills (Layer 4)
    this.foreHills = [
      { cx: -180, cy: 670, rx: 460, ry: 210, color: '#42b678' },
      { cx: 360,  cy: 640, rx: 520, ry: 220, color: '#38a96d' },
      { cx: 940,  cy: 680, rx: 550, ry: 230, color: '#46bd7d' },
      { cx: 1520, cy: 645, rx: 500, ry: 220, color: '#3cae72' },
      { cx: 2080, cy: 675, rx: 520, ry: 225, color: '#44ba7a' }
    ];

    // 5. Stylized Cartoon Lollipop / Button Trees (Matching Reference Image)
    this.cartoonTrees = [
      { x: -140, y: 440, trunkH: 28, r: 24, trunkColor: '#8a6442', leafColor: '#93d2b2', highColor: '#bcead3' },
      { x: 30,   y: 410, trunkH: 34, r: 28, trunkColor: '#7b5736', leafColor: '#82c9a6', highColor: '#b2e4cb' },
      { x: 190,  y: 435, trunkH: 26, r: 22, trunkColor: '#8a6442', leafColor: '#97d6b7', highColor: '#c1ecda' },
      { x: 420,  y: 395, trunkH: 38, r: 32, trunkColor: '#7b5736', leafColor: '#7ec6a1', highColor: '#ade2c7' },
      { x: 610,  y: 430, trunkH: 25, r: 23, trunkColor: '#8a6442', leafColor: '#8fcfae', highColor: '#bce8d2' },
      { x: 780,  y: 415, trunkH: 32, r: 27, trunkColor: '#7b5736', leafColor: '#84caa8', highColor: '#b4e5cd' },
      { x: 960,  y: 445, trunkH: 28, r: 25, trunkColor: '#8a6442', leafColor: '#93d2b2', highColor: '#bcead3' },
      { x: 1140, y: 410, trunkH: 36, r: 30, trunkColor: '#7b5736', leafColor: '#7ec6a1', highColor: '#ade2c7' },
      { x: 1320, y: 425, trunkH: 26, r: 24, trunkColor: '#8a6442', leafColor: '#8acfa9', highColor: '#b9e7cf' },
      { x: 1510, y: 395, trunkH: 38, r: 31, trunkColor: '#7b5736', leafColor: '#81c8a5', highColor: '#b0e3c9' },
      { x: 1710, y: 435, trunkH: 26, r: 23, trunkColor: '#8a6442', leafColor: '#92d1b1', highColor: '#bce9d2' },
      { x: 1910, y: 415, trunkH: 34, r: 29, trunkColor: '#7b5736', leafColor: '#7ec6a1', highColor: '#ade2c7' }
    ];

    // 6. Cartoon Grass Tufts & Pebble Dots on Hill Slopes
    this.grassTufts = [
      { x: -90, y: 480, h: 14, color: '#2f8f5c' },
      { x: 110, y: 450, h: 16, color: '#2b8454' },
      { x: 280, y: 470, h: 15, color: '#2f8f5c' },
      { x: 520, y: 440, h: 17, color: '#277a4e' },
      { x: 710, y: 475, h: 14, color: '#2f8f5c' },
      { x: 880, y: 460, h: 16, color: '#2b8454' },
      { x: 1040, y: 480, h: 15, color: '#2f8f5c' },
      { x: 1250, y: 445, h: 18, color: '#277a4e' },
      { x: 1430, y: 465, h: 15, color: '#2b8454' },
      { x: 1630, y: 450, h: 16, color: '#2f8f5c' },
      { x: 1820, y: 470, h: 14, color: '#2b8454' }
    ];

    this.pebbles = [
      { x: -50, y: 520, r: 5.5, color: 'rgba(40, 95, 65, 0.22)' },
      { x: -38, y: 526, r: 3.5, color: 'rgba(40, 95, 65, 0.22)' },
      { x: 340, y: 490, r: 6.0, color: 'rgba(40, 95, 65, 0.22)' },
      { x: 352, y: 497, r: 4.0, color: 'rgba(40, 95, 65, 0.22)' },
      { x: 740, y: 510, r: 5.0, color: 'rgba(40, 95, 65, 0.22)' },
      { x: 750, y: 516, r: 3.5, color: 'rgba(40, 95, 65, 0.22)' },
      { x: 1180, y: 495, r: 6.0, color: 'rgba(40, 95, 65, 0.22)' },
      { x: 1194, y: 502, r: 4.0, color: 'rgba(40, 95, 65, 0.22)' },
      { x: 1560, y: 505, r: 5.5, color: 'rgba(40, 95, 65, 0.22)' },
      { x: 1572, y: 512, r: 3.5, color: 'rgba(40, 95, 65, 0.22)' }
    ];

    // 7. Subtle Wildflowers along platform surfaces
    this.flowers = [
      { platId: 'main', relX: 30,  color: '#facc15', size: 4.5 },
      { platId: 'main', relX: 85,  color: '#f472b6', size: 4 },
      { platId: 'main', relX: 160, color: '#ffffff', size: 5 },
      { platId: 'main', relX: 240, color: '#facc15', size: 4.5 },
      { platId: 'main', relX: 320, color: '#38bdf8', size: 4 },
      { platId: 'main', relX: 420, color: '#f472b6', size: 5 },
      { platId: 'main', relX: 510, color: '#ffffff', size: 4.5 },
      { platId: 'main', relX: 590, color: '#facc15', size: 4 },
      { platId: 'main', relX: 665, color: '#fb7185', size: 4.5 },
      { platId: 'high_center', relX: 25,  color: '#facc15', size: 4 },
      { platId: 'high_center', relX: 200, color: '#ffffff', size: 4.5 },
      { platId: 'high_center', relX: 375, color: '#f472b6', size: 4 },
      { platId: 'mid_left',    relX: 25,  color: '#38bdf8', size: 4 },
      { platId: 'mid_left',    relX: 205, color: '#facc15', size: 4.5 },
      { platId: 'mid_right',   relX: 25,  color: '#f472b6', size: 4 },
      { platId: 'mid_right',   relX: 205, color: '#ffffff', size: 4.5 },
      { platId: 'low_left',    relX: 40,  color: '#facc15', size: 4.5 },
      { platId: 'low_left',    relX: 180, color: '#f472b6', size: 4 },
      { platId: 'low_right',   relX: 40,  color: '#ffffff', size: 4 },
      { platId: 'low_right',   relX: 180, color: '#38bdf8', size: 4.5 }
    ];

    // 8. Hanging Ivy Vines underneath platforms
    this.hangingVines = [
      { platId: 'main', relX: 65,  len: 75, seed: 1.2 },
      { platId: 'main', relX: 150, len: 110, seed: 2.7 },
      { platId: 'main', relX: 275, len: 85, seed: 0.8 },
      { platId: 'main', relX: 430, len: 120, seed: 3.4 },
      { platId: 'main', relX: 550, len: 90, seed: 1.9 },
      { platId: 'main', relX: 640, len: 70, seed: 2.2 },
      { platId: 'low_left',  relX: 60,  len: 65, seed: 1.5 },
      { platId: 'low_left',  relX: 160, len: 80, seed: 2.9 },
      { platId: 'low_right', relX: 60,  len: 85, seed: 0.5 },
      { platId: 'low_right', relX: 160, len: 65, seed: 3.1 }
    ];

    // 9. Ambient Drifting Leaves & Dandelion Fluff (Gentle breeze)
    this.ambientLeaves = [];
    for (let i = 0; i < 28; i++) {
      this.ambientLeaves.push({
        x: Math.random() * 2400 - 300,
        y: Math.random() * 1200 - 200,
        vx: 15 + Math.random() * 22,
        vy: 16 + Math.random() * 18,
        size: 3.5 + Math.random() * 4,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.5,
        wobbleSpeed: 1.2 + Math.random() * 2.0,
        seed: Math.random() * Math.PI * 2,
        type: i % 4 === 0 ? 'pink_petal' : (i % 3 === 0 ? 'dandelion_fluff' : 'green_leaf')
      });
    }
  }

  // --- UPDATE SIMULATION ---
  update(dt) {
    this.time += dt;

    // 1. Update horizontal moving platforms & vertical lifts
    for (const plat of this.platforms) {
      if (plat.style === 'moving' && plat.moveType === 'horizontal') {
        plat.time += dt * plat.speed;
        const prevX = plat.x;
        plat.x = plat.baseX + Math.sin(plat.time) * plat.range;
        plat.vx = (plat.x - prevX) / dt;
        plat.vy = 0;
      } else if (plat.style === 'lift' || plat.moveType === 'lift') {
        plat.timer = (plat.timer + dt) % plat.cycleTime;
        const halfCycle = plat.cycleTime / 2;
        const travelDuration = halfCycle - plat.pauseTime;
        const prevY = plat.y;

        if (plat.timer < travelDuration) {
          // Smooth upward travel with cosine ease-in-out
          const progress = plat.timer / travelDuration;
          const ease = (1 - Math.cos(progress * Math.PI)) / 2;
          plat.y = plat.yBottom - (plat.yBottom - plat.yTop) * ease;
        } else if (plat.timer < halfCycle) {
          // Pause at upper level
          plat.y = plat.yTop;
        } else if (plat.timer < halfCycle + travelDuration) {
          // Smooth downward travel with cosine ease-in-out
          const progress = (plat.timer - halfCycle) / travelDuration;
          const ease = (1 - Math.cos(progress * Math.PI)) / 2;
          plat.y = plat.yTop + (plat.yBottom - plat.yTop) * ease;
        } else {
          // Pause at lower level
          plat.y = plat.yBottom;
        }

        plat.vx = 0;
        plat.vy = (plat.y - prevY) / dt;
      }
    }

    // 2. Keep spring pads firmly attached directly to their platforms (moves together if platform moves)
    for (const pad of this.springPads) {
      if (pad.platId) {
        const plat = this.platforms.find(p => p.id === pad.platId);
        if (plat) {
          pad.x = plat.x + (plat.w - pad.w) * pad.relX;
          pad.y = plat.y - pad.h + 2;
        }
      }
      if (pad.animTime > 0) {
        pad.animTime -= dt * 6;
      }
    }

    // 3. Update drifting sky clouds (Wrap smoothly across screen)
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > 2600) {
        c.x = -650;
      }
    }

    // 4. Update fluttering ambient leaves and fluff
    for (const leaf of this.ambientLeaves) {
      leaf.x += (leaf.vx + Math.sin(this.time * leaf.wobbleSpeed + leaf.seed) * 14) * dt;
      leaf.y += leaf.vy * dt;
      leaf.angle += leaf.rotSpeed * dt;

      if (leaf.y > 1200) {
        leaf.y = -300;
        leaf.x = Math.random() * 2400 - 300;
      }
      if (leaf.x > 2500) leaf.x = -400;
      if (leaf.x < -500) leaf.x = 2400;
    }
  }

  // Check spring pad bounce for character (Exact same mechanics)
  checkSpringPad(fighter) {
    if (fighter.vy < 0) return false; // Only bounce when falling or on ground

    for (const pad of this.springPads) {
      if (
        fighter.x > pad.x - 15 &&
        fighter.x < pad.x + pad.w + 15 &&
        fighter.y >= pad.y - 12 &&
        fighter.y <= pad.y + pad.h + 8
      ) {
        fighter.y = pad.y;
        fighter.vy = pad.bounceVy;
        fighter.onGround = false;
        fighter.jumpsRemaining = 1; // grant double jump back
        fighter.scaleX = 0.7; // high stretch
        fighter.scaleY = 1.4;

        pad.animTime = 1.0;
        window.soundEngine.playBouncePad();
        window.particles.spawnImpact(pad.x + pad.w / 2, pad.y, '#fde047', 12, 0.8);
        window.particles.spawnCombatText(pad.x + pad.w / 2, pad.y - 30, 'BOING!', '#fde047', 20);
        return true;
      }
    }
    return false;
  }

  // ============================================================
  // RENDER NATURAL OUTDOOR ENVIRONMENT (Pure Visual Background)
  // Inspired by cartoon vector nature art: Clean, colorful & bright
  // ============================================================
  renderBackground(ctx) {
    ctx.save();

    const cam = window.gameCamera;
    const camX = cam ? cam.x : 900;
    const camY = cam ? cam.y : 600;

    // Helper to calculate parallax coordinate
    // k = 0 (fixed to screen), k = 1.0 (moves 1:1 with world platforms)
    const px = (worldX, k) => 900 + (worldX - 900) + (camX - 900) * (1 - k);
    const py = (worldY, k) => 600 + (worldY - 600) + (camY - 600) * (1 - k);

    // ------------------------------------------------------------
    // 1. BRIGHT BLUE SKY & ARCHED SKY BANDS (Parallax k = 0.02)
    // ------------------------------------------------------------
    const skyLeft = px(-1400, 0.02);
    const skyTop = py(-1000, 0.02);
    const skyWidth = 4600;
    const skyHeight = 2600;

    // Rich bright cartoon sky gradient
    const skyGrad = ctx.createLinearGradient(0, skyTop, 0, skyTop + skyHeight * 0.75);
    skyGrad.addColorStop(0.0, '#3fa7f5'); // Clean azure blue
    skyGrad.addColorStop(0.35, '#56b4f8'); // Cheerful light cerulean
    skyGrad.addColorStop(0.65, '#84cbfb'); // Soft sky blue
    skyGrad.addColorStop(0.85, '#b8e3fd'); // Light horizon blue
    skyGrad.addColorStop(1.0, '#d9f0fe'); // Horizon glow

    ctx.fillStyle = skyGrad;
    ctx.fillRect(skyLeft, skyTop, skyWidth, skyHeight);

    // Subtle curved cartoon sky bands (Inspired by reference image)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.ellipse(px(900, 0.02), py(-150, 0.02), 2200, 520, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.ellipse(px(900, 0.02), py(-50, 0.02), 2400, 480, 0, 0, Math.PI * 2);
    ctx.fill();

    // ------------------------------------------------------------
    // 2. GIANT SOFT BILLOWY CARTOON CLOUDS (Parallax k = 0.06)
    // ------------------------------------------------------------
    for (const c of this.clouds) {
      const cx = px(c.x, 0.06);
      const cy = py(c.y, 0.06);
      this.drawCartoonCloud(ctx, cx, cy, c.scale, c.puffs);
    }

    // ------------------------------------------------------------
    // 3. DISTANT CARTOON MOUNTAINS / BLUE-PERIWINKLE RIDGES (Parallax k = 0.12)
    // ------------------------------------------------------------
    for (const m of this.distantMountains) {
      const mx = px(m.cx, 0.12);
      const my = py(m.cy, 0.12);

      const mtnGrad = ctx.createLinearGradient(0, my - m.h * 0.4, 0, my + m.h * 0.6);
      mtnGrad.addColorStop(0.0, '#b8d8f0'); // Soft light periwinkle
      mtnGrad.addColorStop(0.6, '#9cc3e3');
      mtnGrad.addColorStop(1.0, '#86b0d4');

      ctx.fillStyle = mtnGrad;
      ctx.beginPath();
      ctx.ellipse(mx, my + 60, m.w * 0.5, m.h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ------------------------------------------------------------
    // 4. MID-DISTANCE ROLLING CARTOON HILLS (Parallax k = 0.22)
    // ------------------------------------------------------------
    // Solid valley ground beneath hills so no gaps appear
    const valleyMid = ctx.createLinearGradient(0, py(560, 0.22), 0, py(1400, 0.22));
    valleyMid.addColorStop(0.0, '#68b993');
    valleyMid.addColorStop(0.5, '#4e9976');
    valleyMid.addColorStop(1.0, '#367256');
    ctx.fillStyle = valleyMid;
    ctx.fillRect(px(-1200, 0.22), py(620, 0.22), 4400, 950);

    for (const hill of this.midHills) {
      const hx = px(hill.cx, 0.22);
      const hy = py(hill.cy, 0.22);

      const hillGrad = ctx.createRadialGradient(hx, hy - 40, hill.ry * 0.25, hx, hy + 60, hill.ry * 1.1);
      hillGrad.addColorStop(0.0, '#8ad4b2'); // Soft pastel sunlit crest
      hillGrad.addColorStop(0.6, hill.color);
      hillGrad.addColorStop(1.0, '#4e9875');

      ctx.fillStyle = hillGrad;
      ctx.beginPath();
      ctx.ellipse(hx, hy + 120, hill.rx, hill.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small stylized cartoon lollipop trees on mid-hill crests (Reference inspired)
    for (const tree of this.cartoonTrees) {
      const tx = px(tree.x, 0.22);
      const ty = py(tree.y, 0.22);
      this.drawLollipopTree(ctx, tx, ty, tree.trunkH, tree.r, tree.trunkColor, tree.leafColor, tree.highColor);
    }

    // ------------------------------------------------------------
    // 5. NEARER CARTOON ROLLING HILLS (Parallax k = 0.38)
    // ------------------------------------------------------------
    const valleyFore = ctx.createLinearGradient(0, py(650, 0.38), 0, py(1450, 0.38));
    valleyFore.addColorStop(0.0, '#38a96d');
    valleyFore.addColorStop(0.4, '#2d8b58');
    valleyFore.addColorStop(1.0, '#1d603c');
    ctx.fillStyle = valleyFore;
    ctx.fillRect(px(-1200, 0.38), py(700, 0.38), 4400, 950);

    for (const hill of this.foreHills) {
      const hx = px(hill.cx, 0.38);
      const hy = py(hill.cy, 0.38);

      const hillGrad = ctx.createRadialGradient(hx, hy - 30, hill.ry * 0.25, hx, hy + 50, hill.ry * 1.15);
      hillGrad.addColorStop(0.0, '#59cb8f'); // Fresh green crest
      hillGrad.addColorStop(0.6, hill.color);
      hillGrad.addColorStop(1.0, '#27794e');

      ctx.fillStyle = hillGrad;
      ctx.beginPath();
      ctx.ellipse(hx, hy + 120, hill.rx, hill.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stylized cartoon 3-blade grass tufts on hill slopes (Reference inspired)
    for (const g of this.grassTufts) {
      const gx = px(g.x, 0.38);
      const gy = py(g.y, 0.38);
      this.drawGrassTuft(ctx, gx, gy, g.h, g.color);
    }

    // Smooth cartoon pebble clusters on hill slopes (Reference inspired)
    for (const p of this.pebbles) {
      const pX = px(p.x, 0.38);
      const pY = py(p.y, 0.38);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(pX, pY, p.r * 1.3, p.r * 0.75, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ------------------------------------------------------------
    // 6. UNDER-PLATFORM ANCIENT SUPPORTS & HANGING VINES (Parallax k = 1.0)
    // ------------------------------------------------------------
    for (const plat of this.platforms) {
      if (plat.style === 'main' || plat.style === 'island') {
        // Weathered stone foundations descending into valley
        const fX = plat.x + 35;
        const fY = plat.y + plat.h;
        const fW = plat.w - 70;
        const fH = 340;

        const pillarGrad = ctx.createLinearGradient(fX, fY, fX + fW, fY + fH);
        pillarGrad.addColorStop(0.0, '#1e293b');
        pillarGrad.addColorStop(0.6, '#0f172a');
        pillarGrad.addColorStop(1.0, '#090d16');

        ctx.fillStyle = pillarGrad;
        ctx.beginPath();
        ctx.roundRect(fX, fY, fW, fH, [0, 0, 16, 16]);
        ctx.fill();

        // Weathered stone masonry lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1.5;
        for (let row = fY + 28; row < fY + fH; row += 36) {
          ctx.beginPath();
          ctx.moveTo(fX + 10, row);
          ctx.lineTo(fX + fW - 10, row);
          ctx.stroke();
        }

        // Moss accents on stone corners
        ctx.fillStyle = 'rgba(34, 197, 94, 0.18)';
        ctx.beginPath();
        ctx.ellipse(fX + 25, fY + 30, 24, 40, 0.2, 0, Math.PI * 2);
        ctx.ellipse(fX + fW - 25, fY + 45, 28, 55, -0.3, 0, Math.PI * 2);
        ctx.fill();

      } else if (plat.style === 'moving') {
        // Enchanted forest motes below moving platforms
        const pulse = Math.sin(this.time * 6) * 4;
        const moteCount = 5;
        for (let i = 0; i < moteCount; i++) {
          const offX = (plat.w / (moteCount + 1)) * (i + 1);
          const moteY = plat.y + plat.h + 8 + Math.sin(this.time * 8 + i * 1.5) * 6;
          const moteRadius = 4.5 + pulse * 0.4;

          const moteGrad = ctx.createRadialGradient(plat.x + offX, moteY, 1, plat.x + offX, moteY, moteRadius * 2.5);
          moteGrad.addColorStop(0.0, 'rgba(167, 243, 208, 0.9)');
          moteGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.45)');
          moteGrad.addColorStop(1.0, 'rgba(52, 211, 153, 0.0)');

          ctx.fillStyle = moteGrad;
          ctx.beginPath();
          ctx.arc(plat.x + offX, moteY, moteRadius * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Render dangling hanging ivy vines with gentle breeze sway
    for (const vine of this.hangingVines) {
      const plat = this.platforms.find(p => p.id === vine.platId);
      if (!plat) continue;

      const vx = plat.x + vine.relX;
      const vy = plat.y + plat.h;
      const sway = Math.sin(this.time * 2.2 + vine.seed) * 8;

      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.quadraticCurveTo(vx + sway * 0.5, vy + vine.len * 0.5, vx + sway, vy + vine.len);
      ctx.stroke();

      // Leaf clusters on vine
      ctx.fillStyle = '#22c55e';
      for (let s = 0.25; s <= 1.0; s += 0.28) {
        const lx = vx + sway * s;
        const ly = vy + vine.len * s;
        ctx.beginPath();
        ctx.ellipse(lx + (s > 0.5 ? 5 : -5), ly, 5, 3, (s > 0.5 ? 0.6 : -0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ------------------------------------------------------------
    // 7. AMBIENT FLUTTERING LEAVES & DANDELION FLUFF (Layer 5)
    // ------------------------------------------------------------
    for (const leaf of this.ambientLeaves) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.angle);

      if (leaf.type === 'green_leaf') {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.75)';
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size * 1.5, leaf.size * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (leaf.type === 'pink_petal') {
        ctx.fillStyle = 'rgba(244, 114, 182, 0.8)';
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size * 1.2, leaf.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Soft white dandelion fluff
        ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
        ctx.beginPath();
        ctx.arc(0, 0, leaf.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // Draw giant billowy cartoon cloud (Inspired by reference image)
  drawCartoonCloud(ctx, x, y, scale = 1.0, puffs = []) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 1. Soft blue/periwinkle shaded underside
    ctx.fillStyle = '#d8ebfb';
    for (const p of puffs) {
      ctx.beginPath();
      ctx.arc(p.ox, p.oy + 14, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Pure bright white top puff bodies
    ctx.fillStyle = '#ffffff';
    for (const p of puffs) {
      ctx.beginPath();
      ctx.arc(p.ox, p.oy, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw stylized cartoon lollipop / button tree (Inspired by reference image)
  drawLollipopTree(ctx, x, y, trunkH, r, trunkColor, leafColor, highColor) {
    ctx.save();
    ctx.translate(x, y);

    // Slender vertical trunk
    ctx.fillStyle = trunkColor;
    ctx.fillRect(-2.5, 0, 5, trunkH);

    // Tree round canopy base shadow
    ctx.fillStyle = '#1c5e3d';
    ctx.beginPath();
    ctx.arc(0, -r + 4, r * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Main smooth spherical canopy
    ctx.fillStyle = leafColor;
    ctx.beginPath();
    ctx.arc(0, -r, r, 0, Math.PI * 2);
    ctx.fill();

    // Top-right spherical highlight circle
    ctx.fillStyle = highColor;
    ctx.beginPath();
    ctx.arc(r * 0.28, -r - r * 0.28, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw stylized 3-blade cartoon grass tuft
  drawGrassTuft(ctx, x, y, h, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;

    // Center blade
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.quadraticCurveTo(-1, -h * 0.6, 0, -h);
    ctx.quadraticCurveTo(1, -h * 0.6, 2, 0);
    ctx.fill();

    // Left curved blade
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(-4, -h * 0.45, -h * 0.45, -h * 0.7);
    ctx.quadraticCurveTo(-1.5, -h * 0.35, -0.5, 0);
    ctx.fill();

    // Right curved blade
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.quadraticCurveTo(4, -h * 0.45, h * 0.45, -h * 0.7);
    ctx.quadraticCurveTo(1.5, -h * 0.35, 0.5, 0);
    ctx.fill();

    ctx.restore();
  }

  // ============================================================
  // RENDER NATURAL PLATFORMS & BOUNCY MUSHROOMS
  // ============================================================
  renderPlatforms(ctx) {
    ctx.save();

    for (const plat of this.platforms) {
      const { x, y, w, h, style } = plat;

      if (style === 'main') {
        // ------------------------------------------------------------
        // CENTRAL MAIN STAGE: Ancient Garden Stone Terrace & Lush Grass
        // ------------------------------------------------------------
        // 1. Weathered Stone Terrace Body
        const stoneGrad = ctx.createLinearGradient(x, y + 10, x, y + h);
        stoneGrad.addColorStop(0.0, '#334155'); // Weathered dark slate
        stoneGrad.addColorStop(0.6, '#1e293b');
        stoneGrad.addColorStop(1.0, '#0f172a');

        ctx.fillStyle = stoneGrad;
        ctx.beginPath();
        ctx.roundRect(x, y + 8, w, h - 8, [0, 0, 14, 14]);
        ctx.fill();

        // Stone boundary relief
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 2. Thick Vibrant Carpet of Lawn Grass on Top
        const grassGrad = ctx.createLinearGradient(x, y, x, y + 14);
        grassGrad.addColorStop(0.0, '#4ade80'); // Fresh sunlit green
        grassGrad.addColorStop(0.4, '#22c55e');
        grassGrad.addColorStop(1.0, '#15803d');

        ctx.fillStyle = grassGrad;
        ctx.beginPath();
        ctx.roundRect(x - 2, y, w + 4, 14, [6, 6, 4, 4]);
        ctx.fill();

        // Crisp neon-clear top highlight for instant jumping legibility
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 1.5);
        ctx.lineTo(x + w - 2, y + 1.5);
        ctx.stroke();

        // Natural grass tufts along the front rim
        ctx.fillStyle = '#22c55e';
        for (let gx = x + 18; gx < x + w - 18; gx += 22) {
          ctx.beginPath();
          ctx.moveTo(gx - 4, y + 12);
          ctx.lineTo(gx, y + 18);
          ctx.lineTo(gx + 4, y + 12);
          ctx.closePath();
          ctx.fill();
        }

        // Stone block decorative lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 60, y + 26);
        ctx.lineTo(x + w - 60, y + 26);
        ctx.stroke();

      } else if (style === 'garden_wood' || style === 'moving' || style === 'lift') {
        // ------------------------------------------------------------
        // JUMPTHROUGH, MOVING PLATFORMS & VERTICAL LIFTS
        // ------------------------------------------------------------
        const isMoving = style === 'moving';
        const isLift = style === 'lift';

        // Sturdy polished wood / lift plank body
        const woodGrad = ctx.createLinearGradient(x, y, x, y + h);
        if (isLift) {
          woodGrad.addColorStop(0.0, '#312e81'); // Indigo/amber enchanted lift
          woodGrad.addColorStop(1.0, '#1e1b4b');
        } else if (isMoving) {
          woodGrad.addColorStop(0.0, '#1e3a5f'); // Enchanted floating teal wood
          woodGrad.addColorStop(1.0, '#0f172a');
        } else {
          woodGrad.addColorStop(0.0, '#78350f'); // Warm polished cedar
          woodGrad.addColorStop(1.0, '#451a03');
        }

        ctx.fillStyle = woodGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 6);
        ctx.fill();

        // Clean border
        ctx.strokeStyle = isLift ? 'rgba(251, 191, 36, 0.45)' : (isMoving ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.2)');
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glowing fresh grass / leaf-green / cyan / amber top rim for contrast
        ctx.strokeStyle = isLift ? '#fbbf24' : (isMoving ? '#38bdf8' : '#4ade80');
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 2);
        ctx.lineTo(x + w - 3, y + 2);
        ctx.stroke();

        // Natural wood grain & grip notches
        ctx.fillStyle = isLift ? 'rgba(251, 191, 36, 0.4)' : (isMoving ? 'rgba(56, 189, 248, 0.35)' : 'rgba(254, 240, 138, 0.35)');
        for (let gx = x + 25; gx < x + w - 20; gx += 28) {
          ctx.fillRect(gx, y + 6, 7, 3);
        }

        // Corner vine buds / gold lift rivets
        ctx.fillStyle = isLift ? '#fbbf24' : '#22c55e';
        ctx.beginPath();
        ctx.arc(x + 5, y + h / 2, 3.5, 0, Math.PI * 2);
        ctx.arc(x + w - 5, y + h / 2, 3.5, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // ------------------------------------------------------------
        // RECOVERY ISLANDS: Floating Earthen Cliff Rocks with Hanging Moss
        // ------------------------------------------------------------
        const islandGrad = ctx.createLinearGradient(x, y + 8, x, y + h);
        islandGrad.addColorStop(0.0, '#3f3f46');
        islandGrad.addColorStop(1.0, '#18181b');

        ctx.fillStyle = islandGrad;
        ctx.beginPath();
        ctx.roundRect(x, y + 6, w, h - 6, [0, 0, 12, 12]);
        ctx.fill();

        // Vibrant grass capping
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.roundRect(x - 2, y, w + 4, 10, [5, 5, 2, 2]);
        ctx.fill();

        // Crisp luminous edge
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 1.5);
        ctx.lineTo(x + w - 2, y + 1.5);
        ctx.stroke();
      }
    }

    // Render little wildflowers along platforms
    for (const f of this.flowers) {
      const plat = this.platforms.find(p => p.id === f.platId);
      if (!plat) continue;

      const fx = plat.x + f.relX;
      const fy = plat.y - 1;

      // Stem
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx, fy + 4);
      ctx.lineTo(fx, fy);
      ctx.stroke();

      // Flower petals
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(fx, fy, f.size * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Golden center core
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(fx, fy, f.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // ------------------------------------------------------------
    // SPRING PADS: Bouncy Garden Mushrooms (Exact same bounce mechanics)
    // ------------------------------------------------------------
    for (const pad of this.springPads) {
      const compression = pad.animTime > 0 ? Math.sin(pad.animTime * Math.PI) * 7 : 0;
      const padY = pad.y + compression;

      // Wooden base socket
      ctx.fillStyle = '#451a03';
      ctx.fillRect(pad.x + 8, pad.y + pad.h - 4, pad.w - 16, 4);

      // Springy mushroom stalk
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.roundRect(pad.x + 16, padY + 6, pad.w - 32, pad.h - compression, 3);
      ctx.fill();

      // Bouncy Red/Orange Spotted Mushroom Cap
      const shroomGrad = ctx.createLinearGradient(pad.x, padY, pad.x, padY + 12);
      shroomGrad.addColorStop(0.0, '#f87171');
      shroomGrad.addColorStop(0.4, '#dc2626');
      shroomGrad.addColorStop(1.0, '#991b1b');

      ctx.fillStyle = shroomGrad;
      ctx.beginPath();
      ctx.ellipse(pad.x + pad.w / 2, padY + 4, pad.w / 2, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // White polka dots
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pad.x + pad.w / 2, padY + 2, 3, 0, Math.PI * 2);
      ctx.arc(pad.x + 14, padY + 5, 2.5, 0, Math.PI * 2);
      ctx.arc(pad.x + pad.w - 14, padY + 5, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Luminous gold bounce rim
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pad.x + 6, padY);
      ctx.lineTo(pad.x + pad.w - 6, padY);
      ctx.stroke();

      // Bounce indicator arrows
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▲▲', pad.x + pad.w / 2, padY + 3);
    }

    ctx.restore();
  }
}

// Global arena singleton
window.arena = new Arena();
