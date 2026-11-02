/* ============================================================
   SQUISH BRAWL - ARENA & PLATFORMS SYSTEM
   Multi-level tactical arena with moving platforms, jump-throughs,
   spring pads, and dynamic neon arcade atmosphere
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
      // 1. Central Main Stage (Wide fighting floor)
      { id: 'main', x: 550, y: 720, w: 700, h: 48, type: 'solid', style: 'main' },

      // 2. High Ground Central Platform (Jumpthrough)
      { id: 'high_center', x: 700, y: 520, w: 400, h: 22, type: 'jumpthrough', style: 'tech' },

      // 3. Highest Apex Perch (Tactical crown point)
      { id: 'apex', x: 800, y: 340, w: 200, h: 18, type: 'jumpthrough', style: 'tech' },

      // 4. Left Mid Platform (Jumpthrough)
      { id: 'mid_left', x: 260, y: 600, w: 230, h: 22, type: 'jumpthrough', style: 'tech' },

      // 5. Right Mid Platform (Jumpthrough)
      { id: 'mid_right', x: 1310, y: 600, w: 230, h: 22, type: 'jumpthrough', style: 'tech' },

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

    // Jump / Spring Pads (Bounce players high into the air)
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

    // Visual background ambient elements
    this.time = 0;
    this.spotlights = [
      { x: 400, angle: 0.3, speed: 0.6, color: 'rgba(255, 42, 75, 0.08)' },
      { x: 900, angle: -0.2, speed: 0.45, color: 'rgba(0, 229, 255, 0.08)' },
      { x: 1400, angle: 0.4, speed: 0.55, color: 'rgba(255, 204, 0, 0.08)' }
    ];
  }

  update(dt) {
    this.time += dt;

    // 1. Update moving platforms
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

    // 2. Update spring pad animations
    for (const pad of this.springPads) {
      if (pad.animTime > 0) {
        pad.animTime -= dt * 6;
      }
    }

    // 3. Update spotlights
    for (const spot of this.spotlights) {
      spot.currentAngle = Math.sin(this.time * spot.speed) * spot.angle;
    }
  }

  // Check spring pad bounce for character
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
        window.particles.spawnImpact(pad.x + pad.w / 2, pad.y, '#ffde59', 12, 0.8);
        window.particles.spawnCombatText(pad.x + pad.w / 2, pad.y - 30, 'BOING!', '#ffde59', 20);
        return true;
      }
    }
    return false;
  }

  // Render background elements (behind characters)
  renderBackground(ctx) {
    ctx.save();

    // 1. Sci-fi neon grid lines in the distance
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = -200; x <= 2000; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, -300);
      ctx.lineTo(x, 1200);
      ctx.stroke();
    }
    for (let y = -200; y <= 1100; y += 100) {
      ctx.beginPath();
      ctx.moveTo(-200, y);
      ctx.lineTo(2000, y);
      ctx.stroke();
    }

    // 2. Animated stadium spotlights
    for (const spot of this.spotlights) {
      ctx.save();
      ctx.translate(spot.x, -250);
      ctx.rotate(spot.currentAngle);

      const grad = ctx.createRadialGradient(0, 0, 10, 0, 1200, 450);
      grad.addColorStop(0, spot.color);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-30, 0);
      ctx.lineTo(-240, 1400);
      ctx.lineTo(240, 1400);
      ctx.lineTo(30, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // 3. Huge neon stadium logo banner in the back
    ctx.font = '900 120px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 42, 75, 0.04)';
    ctx.fillText('SQUISH BRAWL', 900, 200);

    // 4. Platform support pillars & thruster effects
    for (const plat of this.platforms) {
      if (plat.style === 'solid') {
        // Concrete/metallic support pillars extending into bottom
        ctx.fillStyle = 'rgba(15, 20, 32, 0.7)';
        ctx.fillRect(plat.x + 40, plat.y + plat.h, plat.w - 80, 280);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x + 40, plat.y + plat.h, plat.w - 80, 280);
      } else if (plat.style === 'moving') {
        // Glowing hover thrusters below moving platforms
        const flameH = 14 + Math.sin(this.time * 20) * 5;
        const gradFlame = ctx.createLinearGradient(0, plat.y + plat.h, 0, plat.y + plat.h + flameH);
        gradFlame.addColorStop(0, 'rgba(0, 229, 255, 0.8)');
        gradFlame.addColorStop(1, 'transparent');
        ctx.fillStyle = gradFlame;

        ctx.beginPath();
        ctx.ellipse(plat.x + 35, plat.y + plat.h + 2, 14, flameH, 0, 0, Math.PI * 2);
        ctx.ellipse(plat.x + plat.w - 35, plat.y + plat.h + 2, 14, flameH, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Render foreground platforms and spring pads
  renderPlatforms(ctx) {
    ctx.save();

    for (const plat of this.platforms) {
      const { x, y, w, h, style } = plat;

      if (style === 'main') {
        // Main stage: Heavy cyber platform
        // Platform body gradient
        const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
        bodyGrad.addColorStop(0, '#2b354f');
        bodyGrad.addColorStop(1, '#151928');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, [8, 8, 14, 14]);
        ctx.fill();

        // Glowing neon top rim
        ctx.strokeStyle = '#ff3355';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + w - 2, y + 2);
        ctx.stroke();

        // Tech accent line
        ctx.strokeStyle = '#ffde59';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 50, y + 14);
        ctx.lineTo(x + w - 50, y + 14);
        ctx.stroke();

        // Edge chevrons
        ctx.fillStyle = '#ffde59';
        ctx.fillRect(x + 12, y + 8, 8, h - 16);
        ctx.fillRect(x + w - 20, y + 8, 8, h - 16);

      } else if (style === 'tech' || style === 'moving') {
        // Semi-transparent glass/metal jumpthrough
        const isMoving = style === 'moving';
        const topColor = isMoving ? '#00e5ff' : '#6366f1';

        ctx.fillStyle = isMoving ? 'rgba(15, 30, 50, 0.88)' : 'rgba(25, 28, 45, 0.85)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 6);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glowing top rail
        ctx.strokeStyle = topColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 2);
        ctx.lineTo(x + w - 4, y + 2);
        ctx.stroke();

        // Grip notches
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        for (let gx = x + 25; gx < x + w - 20; gx += 30) {
          ctx.fillRect(gx, y + 6, 8, 3);
        }
      } else {
        // Recovery Islands (Solid narrow perches)
        const islandGrad = ctx.createLinearGradient(x, y, x, y + h);
        islandGrad.addColorStop(0, '#374151');
        islandGrad.addColorStop(1, '#111827');
        ctx.fillStyle = islandGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, [6, 6, 12, 12]);
        ctx.fill();

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + w - 2, y + 2);
        ctx.stroke();
      }
    }

    // Render Spring Pads
    for (const pad of this.springPads) {
      const compression = pad.animTime > 0 ? Math.sin(pad.animTime * Math.PI) * 6 : 0;
      const padY = pad.y + compression;

      // Base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(pad.x, pad.y + pad.h - 4, pad.w, 4);

      // Spring coil
      ctx.strokeStyle = '#ffde59';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pad.x + 10, pad.y + pad.h - 4);
      ctx.lineTo(pad.x + pad.w - 10, padY + 4);
      ctx.stroke();

      // Top pad plate
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.roundRect(pad.x, padY, pad.w, 8, 4);
      ctx.fill();

      // Chevrons
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▲▲▲', pad.x + pad.w / 2, padY + 4);
    }

    ctx.restore();
  }
}

// Global arena singleton
window.arena = new Arena();
