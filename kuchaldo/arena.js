/* ============================================================
   SQUISH BRAWL - ARENA & PLATFORMS SYSTEM (NATURAL GARDEN & FOREST)
   Multi-level tactical arena with moving platforms, jump-throughs,
   bouncy mushroom spring pads, and layered natural parallax scenery
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

    // Platform definitions (Gameplay, collision & positions remain 100% LOCKED)
    // type: 'solid' (cannot pass through) or 'jumpthrough' (can jump up through, drop down with S)
    this.platforms = [
      // 1. Central Main Stage (Wide fighting floor)
      { id: 'main', x: 550, y: 720, w: 700, h: 48, type: 'solid', style: 'main' },

      // 2. High Ground Central Platform (Jumpthrough)
      { id: 'high_center', x: 700, y: 520, w: 400, h: 22, type: 'jumpthrough', style: 'garden_wood' },

      // 3. Highest Apex Perch (Tactical crown point)
      { id: 'apex', x: 800, y: 340, w: 200, h: 18, type: 'jumpthrough', style: 'garden_wood' },

      // 4. Left Mid Platform (Jumpthrough)
      { id: 'mid_left', x: 260, y: 600, w: 230, h: 22, type: 'jumpthrough', style: 'garden_wood' },

      // 5. Right Mid Platform (Jumpthrough)
      { id: 'mid_right', x: 1310, y: 600, w: 230, h: 22, type: 'jumpthrough', style: 'garden_wood' },

      // 6. Left Low Recovery Island (Solid narrow)
      { id: 'low_left', x: 120, y: 820, w: 220, h: 36, type: 'solid', style: 'island' },

      // 7. Right Low Recovery Island (Solid narrow)
      { id: 'low_right', x: 1460, y: 820, w: 220, h: 36, type: 'solid', style: 'island' },

      // 8. Moving Horizontal Platform (Patrols across left chasm)
      {
        id: 'moving_horiz',
        x: 350,
        baseX: 350,
        y: 710,
        w: 160,
        h: 22,
        type: 'jumpthrough',
        style: 'moving',
        moveType: 'horizontal',
        range: 150,
        speed: 1.2,
        time: 0,
        vx: 0,
        vy: 0
      },

      // 9. Moving Vertical Platform (Elevator on right side)
      {
        id: 'moving_vert',
        x: 1280,
        y: 690,
        baseY: 690,
        w: 160,
        h: 22,
        type: 'jumpthrough',
        style: 'moving',
        moveType: 'vertical',
        range: 120,
        speed: 1.4,
        time: Math.PI,
        vx: 0,
        vy: 0
      }
    ];

    // Jump / Spring Pads (Bounce players high into the air - exact same mechanics)
    this.springPads = [
      { id: 'spring_left', x: 180, y: 820 - 12, w: 50, h: 14, bounceVy: -1050, animTime: 0 },
      { id: 'spring_right', x: 1570, y: 820 - 12, w: 50, h: 14, bounceVy: -1050, animTime: 0 }
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
    // NATURAL ENVIRONMENT PROCEDURAL DATA (Layered Parallax)
    // ============================================================
    this.time = 0;

    // 1. Drifting Soft Clouds (Layer 1)
    this.clouds = [
      { x: -150, y: -40,  scale: 1.15, speed: 7 },
      { x: 340,  y: 35,   scale: 0.9,  speed: 11 },
      { x: 820,  y: -65,  scale: 1.3,  speed: 6 },
      { x: 1350, y: 10,   scale: 1.05, speed: 9 },
      { x: 1840, y: -30,  scale: 1.1,  speed: 8 },
      { x: 2320, y: 40,   scale: 1.2,  speed: 10 }
    ];

    // 2. Far Mountain Peaks (Layer 2)
    this.mountainPeaksFar = [
      { x: -500, h: 480 }, { x: -200, h: 540 }, { x: 100, h: 450 },
      { x: 420, h: 620 },  { x: 740, h: 510 },  { x: 1050, h: 590 },
      { x: 1380, h: 530 }, { x: 1680, h: 640 }, { x: 1980, h: 500 },
      { x: 2320, h: 560 }, { x: 2650, h: 490 }
    ];

    this.mountainPeaksMid = [
      { x: -400, h: 360 }, { x: -80, h: 420 },  { x: 240, h: 380 },
      { x: 580, h: 470 },  { x: 920, h: 410 },  { x: 1220, h: 450 },
      { x: 1540, h: 390 }, { x: 1840, h: 460 }, { x: 2150, h: 370 },
      { x: 2500, h: 430 }
    ];

    // 3. Mid-Distance Forest Hills & Canopy Crests (Layer 3)
    this.forestHills = [
      { cx: -200, cy: 520, rx: 420, ry: 200, color: '#276846' },
      { cx: 300,  cy: 500, rx: 480, ry: 220, color: '#2f7c55' },
      { cx: 850,  cy: 530, rx: 520, ry: 230, color: '#276846' },
      { cx: 1400, cy: 490, rx: 460, ry: 210, color: '#33885d' },
      { cx: 1950, cy: 520, rx: 490, ry: 220, color: '#2a724d' },
      { cx: 2500, cy: 510, rx: 440, ry: 200, color: '#2f7c55' }
    ];

    // 4. Distant Trees & Woodland Groves (Layer 4)
    this.backgroundTrees = [
      { x: -120, y: 460, type: 'oak',   h: 170, w: 120, shade: '#38a169' },
      { x: 60,   y: 440, type: 'pine',  h: 210, w: 90,  shade: '#276749' },
      { x: 220,  y: 470, type: 'bush',  h: 90,  w: 130, shade: '#48bb78' },
      { x: 420,  y: 420, type: 'oak',   h: 190, w: 140, shade: '#2f855a' },
      { x: 580,  y: 450, type: 'pine',  h: 230, w: 95,  shade: '#22543d' },
      { x: 740,  y: 430, type: 'birch', h: 180, w: 110, shade: '#48bb78' },
      { x: 920,  y: 460, type: 'oak',   h: 175, w: 135, shade: '#38a169' },
      { x: 1080, y: 435, type: 'pine',  h: 220, w: 90,  shade: '#276749' },
      { x: 1240, y: 450, type: 'oak',   h: 185, w: 130, shade: '#2f855a' },
      { x: 1420, y: 425, type: 'birch', h: 190, w: 115, shade: '#48bb78' },
      { x: 1580, y: 460, type: 'pine',  h: 215, w: 95,  shade: '#22543d' },
      { x: 1760, y: 440, type: 'oak',   h: 170, w: 125, shade: '#38a169' },
      { x: 1940, y: 465, type: 'pine',  h: 200, w: 85,  shade: '#276749' }
    ];

    // 5. Subtle Wildflowers along platform surfaces (Precomputed for stability)
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

    // 6. Hanging Ivy Vines underneath platforms
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

    // 7. Ambient Drifting Leaves & Golden Sun Spores (Layer 5)
    this.ambientLeaves = [];
    for (let i = 0; i < 32; i++) {
      this.ambientLeaves.push({
        x: Math.random() * 2400 - 300,
        y: Math.random() * 1200 - 200,
        vx: 14 + Math.random() * 24,
        vy: 16 + Math.random() * 20,
        size: 3.5 + Math.random() * 4.5,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.8,
        wobbleSpeed: 1.2 + Math.random() * 2.2,
        seed: Math.random() * Math.PI * 2,
        type: i % 4 === 0 ? 'pink_petal' : (i % 3 === 0 ? 'gold_spore' : 'green_leaf')
      });
    }
  }

  // --- UPDATE SIMULATION ---
  update(dt) {
    this.time += dt;

    // 1. Update moving platforms (Exact same physics)
    for (const plat of this.platforms) {
      if (plat.style === 'moving') {
        plat.time += dt * plat.speed;
        if (plat.moveType === 'horizontal') {
          const prevX = plat.x;
          plat.x = plat.baseX + Math.sin(plat.time) * plat.range;
          plat.vx = (plat.x - prevX) / dt;
          plat.vy = 0;
        } else if (plat.moveType === 'vertical') {
          const prevY = plat.y;
          plat.y = plat.baseY + Math.sin(plat.time) * plat.range;
          plat.vx = 0;
          plat.vy = (plat.y - prevY) / dt;
        }
      }
    }

    // 2. Update spring pad bounce compression
    for (const pad of this.springPads) {
      if (pad.animTime > 0) {
        pad.animTime -= dt * 6;
      }
    }

    // 3. Update drifting sky clouds
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > 2600) {
        c.x = -600;
      }
    }

    // 4. Update fluttering ambient leaves and petals
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
  // RENDER NATURAL OUTDOOR ENVIRONMENT (Layered Parallax)
  // ============================================================
  renderBackground(ctx) {
    ctx.save();

    const cam = window.gameCamera;
    const camX = cam ? cam.x : 900;
    const camY = cam ? cam.y : 600;

    // Helper to calculate parallax world coordinate
    // k = 0 (fixed to screen), k = 1.0 (moves with world)
    const px = (worldX, k) => 900 + (worldX - 900) + (camX - 900) * (1 - k);
    const py = (worldY, k) => 600 + (worldY - 600) + (camY - 600) * (1 - k);

    // ------------------------------------------------------------
    // 1. SKY & WARM SUN (Parallax k = 0.02)
    // ------------------------------------------------------------
    const skyLeft = px(-1400, 0.02);
    const skyTop = py(-1000, 0.02);
    const skyWidth = 4600;
    const skyHeight = 2600;

    const skyGrad = ctx.createLinearGradient(0, skyTop, 0, skyTop + skyHeight * 0.75);
    skyGrad.addColorStop(0.0, '#3888df'); // Fresh rich blue zenith
    skyGrad.addColorStop(0.35, '#60a5fa'); // Clear morning cerulean
    skyGrad.addColorStop(0.65, '#93c5fd'); // Soft sky blue
    skyGrad.addColorStop(0.85, '#bfdbfe'); // Horizon azure
    skyGrad.addColorStop(1.0, '#dbeafe'); // Gentle warm ground haze

    ctx.fillStyle = skyGrad;
    ctx.fillRect(skyLeft, skyTop, skyWidth, skyHeight);

    // Sun with warm layered radial glow
    const sunX = px(1360, 0.03);
    const sunY = py(20, 0.03);

    const sunCorona = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 320);
    sunCorona.addColorStop(0.0, 'rgba(255, 255, 245, 0.95)');
    sunCorona.addColorStop(0.18, 'rgba(254, 240, 138, 0.6)');
    sunCorona.addColorStop(0.45, 'rgba(253, 224, 71, 0.22)');
    sunCorona.addColorStop(1.0, 'rgba(253, 224, 71, 0.0)');

    ctx.fillStyle = sunCorona;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 320, 0, Math.PI * 2);
    ctx.fill();

    // Gentle natural god rays angling through sky
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(0.36);
    for (let r = -2; r <= 2; r++) {
      ctx.fillStyle = 'rgba(255, 255, 230, 0.035)';
      ctx.beginPath();
      ctx.moveTo(-15 + r * 50, 0);
      ctx.lineTo(-120 + r * 140, 1800);
      ctx.lineTo(40 + r * 140, 1800);
      ctx.lineTo(15 + r * 50, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // ------------------------------------------------------------
    // 2. SOFT DRIFTING CLOUDS (Parallax k = 0.06)
    // ------------------------------------------------------------
    for (const c of this.clouds) {
      const cx = px(c.x, 0.06);
      const cy = py(c.y, 0.06);
      this.drawCloud(ctx, cx, cy, c.scale);
    }

    // ------------------------------------------------------------
    // 3. DISTANT MISTY MOUNTAINS (Parallax k = 0.12)
    // ------------------------------------------------------------
    // Far mountain ridge
    ctx.fillStyle = '#64748b'; // Soft slate-lavender
    ctx.beginPath();
    ctx.moveTo(px(-800, 0.12), py(720, 0.12));
    for (const p of this.mountainPeaksFar) {
      const mx = px(p.x, 0.12);
      const my = py(720 - p.h, 0.12);
      ctx.lineTo(mx, my);
    }
    ctx.lineTo(px(2900, 0.12), py(720, 0.12));
    ctx.closePath();
    ctx.fill();

    // Mid mountain ridge with depth shading
    const mtnGrad = ctx.createLinearGradient(0, py(280, 0.16), 0, py(760, 0.16));
    mtnGrad.addColorStop(0.0, '#475569');
    mtnGrad.addColorStop(0.7, '#64748b');
    mtnGrad.addColorStop(1.0, '#94a3b8');

    ctx.fillStyle = mtnGrad;
    ctx.beginPath();
    ctx.moveTo(px(-600, 0.16), py(760, 0.16));
    for (const p of this.mountainPeaksMid) {
      const mx = px(p.x, 0.16);
      const my = py(760 - p.h, 0.16);
      ctx.lineTo(mx, my);
    }
    ctx.lineTo(px(2700, 0.16), py(760, 0.16));
    ctx.closePath();
    ctx.fill();

    // ------------------------------------------------------------
    // 4. ROLLING GREEN FOREST HILLS (Parallax k = 0.26)
    // ------------------------------------------------------------
    // Deep forest valley floor beneath the rolling hills
    const valleyGrad = ctx.createLinearGradient(0, py(620, 0.26), 0, py(1400, 0.26));
    valleyGrad.addColorStop(0.0, '#276846');
    valleyGrad.addColorStop(0.35, '#1b4d33');
    valleyGrad.addColorStop(0.75, '#133925');
    valleyGrad.addColorStop(1.0, '#0a1f14');
    ctx.fillStyle = valleyGrad;
    ctx.fillRect(px(-1200, 0.26), py(640, 0.26), 4400, 960);

    for (const hill of this.forestHills) {
      const hx = px(hill.cx, 0.26);
      const hy = py(hill.cy, 0.26);

      const hillGrad = ctx.createRadialGradient(hx, hy - 40, hill.ry * 0.3, hx, hy + 80, hill.ry * 1.2);
      hillGrad.addColorStop(0.0, '#38a169'); // Sunlit emerald hill crest
      hillGrad.addColorStop(0.7, hill.color);
      hillGrad.addColorStop(1.0, '#1c4532');

      ctx.fillStyle = hillGrad;
      ctx.beginPath();
      ctx.ellipse(hx, hy + 180, hill.rx, hill.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ------------------------------------------------------------
    // 5. MIDGROUND TREES & NATURAL VEGETATION (Parallax k = 0.52)
    // ------------------------------------------------------------
    for (const t of this.backgroundTrees) {
      const tx = px(t.x, 0.52);
      const ty = py(t.y, 0.52);
      this.drawTree(ctx, tx, ty, t.type, t.h, t.w, t.shade);
    }

    // ------------------------------------------------------------
    // 6. UNDER-PLATFORM ANCIENT SUPPORTS & HANGING VINES (Parallax k = 1.0)
    // ------------------------------------------------------------
    for (const plat of this.platforms) {
      if (plat.style === 'main' || plat.style === 'island') {
        // Massive weathered stone foundations descending into the misty valley
        const fX = plat.x + 35;
        const fY = plat.y + plat.h;
        const fW = plat.w - 70;
        const fH = 340;

        // Earthen stone block gradient
        const pillarGrad = ctx.createLinearGradient(fX, fY, fX + fW, fY + fH);
        pillarGrad.addColorStop(0.0, '#1e293b');
        pillarGrad.addColorStop(0.6, '#0f172a');
        pillarGrad.addColorStop(1.0, '#090d16');

        ctx.fillStyle = pillarGrad;
        ctx.beginPath();
        ctx.roundRect(fX, fY, fW, fH, [0, 0, 16, 16]);
        ctx.fill();

        // Weathered stone brick lines
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
        // Enchanted forest motes below moving platforms (replaces harsh tech jets)
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
    // 7. AMBIENT FLUTTERING LEAVES & GOLDEN SPORES (Layer 5)
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
        // Golden sun spore / pollen mote
        ctx.fillStyle = 'rgba(250, 204, 21, 0.75)';
        ctx.beginPath();
        ctx.arc(0, 0, leaf.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // Draw natural puffy cloud
  drawCloud(ctx, x, y, scale = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Soft cloud shadow underside
    ctx.fillStyle = 'rgba(224, 242, 254, 0.82)';
    ctx.beginPath();
    ctx.ellipse(60, 24, 75, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cloud puffy body
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.arc(35, 12, 28, 0, Math.PI * 2);
    ctx.arc(70, -2, 36, 0, Math.PI * 2);
    ctx.arc(105, 10, 28, 0, Math.PI * 2);
    ctx.arc(135, 20, 20, 0, Math.PI * 2);
    ctx.arc(10, 22, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw stylized natural tree
  drawTree(ctx, x, y, type, h, w, shade) {
    ctx.save();
    ctx.translate(x, y);

    // Trunk
    const trunkW = w * 0.16;
    const trunkH = h * 0.45;
    ctx.fillStyle = '#78350f'; // Warm cedar bark
    ctx.beginPath();
    ctx.roundRect(-trunkW / 2, 0, trunkW, trunkH, [2, 2, 6, 6]);
    ctx.fill();

    // Canopy
    if (type === 'pine') {
      // 3 Tiered Pine foliage
      for (let i = 0; i < 3; i++) {
        const tierY = -trunkH * 0.2 - i * (h * 0.24);
        const tierW = w * (0.9 - i * 0.18);
        const tierH = h * 0.32;

        ctx.fillStyle = i === 2 ? '#22c55e' : shade;
        ctx.beginPath();
        ctx.moveTo(0, tierY - tierH);
        ctx.lineTo(tierW / 2, tierY);
        ctx.lineTo(-tierW / 2, tierY);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Lush rounded broadleaf/oak canopy
      const canY = -trunkH * 0.35;

      // Shadow underside
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.ellipse(0, canY + 12, w * 0.48, h * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main foliage
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(-w * 0.22, canY, w * 0.26, 0, Math.PI * 2);
      ctx.arc(w * 0.22, canY, w * 0.26, 0, Math.PI * 2);
      ctx.arc(0, canY - h * 0.14, w * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Sunlit foliage highlight
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(w * 0.08, canY - h * 0.18, w * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

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

      } else if (style === 'garden_wood' || style === 'moving') {
        // ------------------------------------------------------------
        // JUMPTHROUGH & MOVING PLATFORMS: Crafted Garden Wood Planks
        // ------------------------------------------------------------
        const isMoving = style === 'moving';

        // Sturdy polished wood plank body
        const woodGrad = ctx.createLinearGradient(x, y, x, y + h);
        if (isMoving) {
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
        ctx.strokeStyle = isMoving ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glowing fresh grass / leaf-green top rim for perfect player contrast
        ctx.strokeStyle = isMoving ? '#38bdf8' : '#4ade80';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 2);
        ctx.lineTo(x + w - 3, y + 2);
        ctx.stroke();

        // Natural wood grain & grip notches
        ctx.fillStyle = isMoving ? 'rgba(56, 189, 248, 0.35)' : 'rgba(254, 240, 138, 0.35)';
        for (let gx = x + 25; gx < x + w - 20; gx += 28) {
          ctx.fillRect(gx, y + 6, 7, 3);
        }

        // Corner vine buds
        ctx.fillStyle = '#22c55e';
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
