/* ============================================================
   SQUISH BRAWL - JUICY PARTICLE & FLOATING COMBAT TEXT SYSTEM
   ============================================================ */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.combatTexts = [];
    this.shockwaves = [];
  }

  reset() {
    this.particles.length = 0;
    this.combatTexts.length = 0;
    this.shockwaves.length = 0;
  }

  // --- SPAWN IMPACT PARTICLES ---
  spawnImpact(x, y, color = '#ffcc00', count = 14, speedScale = 1) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (140 + Math.random() * 260) * speedScale;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 3 + Math.random() * 4,
        color: i % 2 === 0 ? color : '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        gravity: 500,
        type: 'spark'
      });
    }
  }

  // --- DUST POOF (Jump, Land, Dash) ---
  spawnDust(x, y, count = 5, dir = 0) {
    for (let i = 0; i < count; i++) {
      const spreadX = (Math.random() - 0.5) * 20;
      this.particles.push({
        x: x + spreadX,
        y: y + 2,
        vx: (dir * -60) + (Math.random() - 0.5) * 50,
        vy: -20 - Math.random() * 40,
        size: 4 + Math.random() * 5,
        color: 'rgba(230, 235, 255, 0.65)',
        alpha: 0.7,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        gravity: 40,
        type: 'dust'
      });
    }
  }

  // --- EXPANDING SHOCKWAVE RING ---
  spawnShockwave(x, y, radius = 45, color = '#ffffff', duration = 0.3) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      targetRadius: radius,
      color,
      alpha: 0.85,
      life: 0,
      duration
    });
  }

  // --- ELIMINATION EXPLOSION ---
  spawnRingoutExplosion(x, y) {
    // Large shockwave
    this.spawnShockwave(x, y, 120, '#ff3344', 0.5);

    // Blast debris
    const colors = ['#ff2a4b', '#ffde59', '#00e5ff', '#ffffff', '#ff7700'];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 400;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
        gravity: 350,
        type: 'spark'
      });
    }

    this.spawnCombatText(x, y - 20, 'K.O.!', '#ff3344', 36);
  }

  // --- FLOATING COMBAT TEXT ("POW!", "SQUISH!", "K.O.!") ---
  spawnCombatText(x, y, text, color = '#ffffff', size = 22) {
    this.combatTexts.push({
      x,
      y,
      text,
      color,
      size,
      alpha: 1,
      life: 0,
      maxLife: 0.75,
      vy: -90,
      scale: 0.5
    });
  }

  // --- UPDATE ALL PARTICLES ---
  update(dt) {
    // 1. Regular Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
      if (p.type === 'dust') {
        p.size += dt * 10;
      }
    }

    // 2. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life += dt;
      if (sw.life >= sw.duration) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const progress = sw.life / sw.duration;
      sw.radius = 5 + (sw.targetRadius - 5) * Math.sin((progress * Math.PI) / 2);
      sw.alpha = 1 - progress;
    }

    // 3. Combat Texts
    for (let i = this.combatTexts.length - 1; i >= 0; i--) {
      const ct = this.combatTexts[i];
      ct.life += dt;
      if (ct.life >= ct.maxLife) {
        this.combatTexts.splice(i, 1);
        continue;
      }
      ct.y += ct.vy * dt;
      ct.vy *= 0.94; // slow down rise
      const progress = ct.life / ct.maxLife;

      // Pop in then fade
      if (progress < 0.2) {
        ct.scale = 0.5 + (progress / 0.2) * 0.7; // overshoot pop
      } else {
        ct.scale = 1.2 - ((progress - 0.2) / 0.8) * 0.2;
      }
      ct.alpha = Math.max(0, 1 - Math.pow(progress, 2));
    }
  }

  // --- RENDER ALL PARTICLES ---
  render(ctx) {
    ctx.save();

    // 1. Shockwaves
    for (const sw of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = Math.max(1, 4 * sw.alpha);
      ctx.globalAlpha = sw.alpha;
      ctx.stroke();
    }

    // 2. Particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'dust') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Star/diamond spark
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s, p.y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 3. Floating Combat Texts
    ctx.font = '900 24px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const ct of this.combatTexts) {
      ctx.save();
      ctx.translate(ct.x, ct.y);
      ctx.scale(ct.scale, ct.scale);
      ctx.globalAlpha = ct.alpha;

      // Stroke outline
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(ct.text, 0, 0);

      // Fill color
      ctx.fillStyle = ct.color;
      ctx.fillText(ct.text, 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }
}

// Global particles singleton
window.particles = new ParticleSystem();
