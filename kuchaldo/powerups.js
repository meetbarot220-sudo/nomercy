/* ============================================================
   SQUISH BRAWL - ORIGINAL POWER-UPS SYSTEM
   ============================================================ */

const POWERUP_TYPES = {
  TITAN_FIST: {
    id: 'TITAN_FIST',
    name: 'Titan Fist',
    icon: '🥊',
    color: '#ff3300',
    aura: 'rgba(255, 51, 0, 0.45)',
    duration: 9.0,
    desc: '2.5x Knockback Power!'
  },
  SPEED_BOOTS: {
    id: 'SPEED_BOOTS',
    name: 'Hyper Dash',
    icon: '⚡',
    color: '#00e5ff',
    aura: 'rgba(0, 229, 255, 0.45)',
    duration: 9.0,
    desc: 'Fast Speed & Quick Dash!'
  },
  BUBBLE_SHIELD: {
    id: 'BUBBLE_SHIELD',
    name: 'Energy Shield',
    icon: '🛡️',
    color: '#a855f7',
    aura: 'rgba(168, 85, 247, 0.45)',
    duration: 12.0,
    desc: 'Absorbs Next Heavy Hit!'
  },
  SPRING_SHOES: {
    id: 'SPRING_SHOES',
    name: 'Mega Jump',
    icon: '🦘',
    color: '#ffde59',
    aura: 'rgba(255, 222, 89, 0.45)',
    duration: 9.0,
    desc: 'High Jumps & Heavy Stomp!'
  },
  DAMAGE_REPAIR: {
    id: 'DAMAGE_REPAIR',
    name: 'Stability Patch',
    icon: '❤️',
    color: '#22c55e',
    aura: 'rgba(34, 197, 94, 0.45)',
    duration: 0.1, // instant consumable
    desc: '-45% Knockback Damage!'
  }
};

class PowerUpManager {
  constructor() {
    this.items = [];
    this.spawnTimer = 6.0; // first power-up spawns early
    this.spawnInterval = 14.0;
    this.spawnPoints = []; // Tactical points configured in arena
    this.maxActive = 2;
  }

  reset() {
    this.items = [];
    this.spawnTimer = 5.0;
  }

  setSpawnPoints(points) {
    this.spawnPoints = points;
  }

  update(dt, arena) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.items.length < this.maxActive && this.spawnPoints.length > 0) {
      this.spawnTimer = this.spawnInterval;
      this.spawnRandomPowerUp();
    }

    // Update floating items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.bobTime += dt * 3.5;
      item.currentY = item.y + Math.sin(item.bobTime) * 8;
      item.rotation += dt * 1.5;

      // Despawn after 25s if untouched
      item.lifeTime -= dt;
      if (item.lifeTime <= 0) {
        window.particles.spawnDust(item.x, item.y, 8);
        this.items.splice(i, 1);
      }
    }
  }

  spawnRandomPowerUp() {
    // Pick an empty spawn point
    const availablePoints = this.spawnPoints.filter(sp => {
      return !this.items.some(item => Math.hypot(item.x - sp.x, item.y - sp.y) < 60);
    });

    if (availablePoints.length === 0) return;

    const pt = availablePoints[Math.floor(Math.random() * availablePoints.length)];
    const keys = Object.keys(POWERUP_TYPES);
    const chosenType = POWERUP_TYPES[keys[Math.floor(Math.random() * keys.length)]];

    const newItem = {
      x: pt.x,
      y: pt.y,
      currentY: pt.y,
      bobTime: Math.random() * Math.PI * 2,
      rotation: 0,
      type: chosenType,
      lifeTime: 25.0,
      radius: 22
    };

    this.items.push(newItem);

    // Audio & particle feedback
    window.soundEngine.playPowerupSpawn();
    window.particles.spawnImpact(newItem.x, newItem.y, chosenType.color, 16, 0.7);
    window.particles.spawnCombatText(newItem.x, newItem.y - 28, chosenType.name + '!', chosenType.color, 18);
  }

  // Check character overlaps
  checkPickup(fighter) {
    if (!fighter.isAlive) return;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const dist = Math.hypot(fighter.x - item.x, (fighter.y - fighter.radius) - item.currentY);

      if (dist < fighter.radius + item.radius) {
        // Collect!
        this.applyPowerUp(fighter, item.type);
        window.soundEngine.playPowerupCollect();
        window.particles.spawnImpact(item.x, item.currentY, item.type.color, 24, 1.2);
        window.particles.spawnCombatText(fighter.x, fighter.y - 50, item.type.name.toUpperCase() + '!', item.type.color, 22);

        this.items.splice(i, 1);
      }
    }
  }

  applyPowerUp(fighter, type) {
    if (type.id === 'DAMAGE_REPAIR') {
      fighter.damagePercentage = Math.max(0, fighter.damagePercentage - 45);
      return;
    }

    // Set or refresh active buff
    fighter.activeBuff = {
      id: type.id,
      name: type.name,
      icon: type.icon,
      color: type.color,
      aura: type.aura,
      duration: type.duration,
      remaining: type.duration
    };

    if (type.id === 'BUBBLE_SHIELD') {
      fighter.hasShield = true;
    }
  }

  render(ctx) {
    ctx.save();
    for (const item of this.items) {
      const { x, currentY, type, lifeTime } = item;

      // Flashing when about to expire (< 4s)
      if (lifeTime < 4 && Math.floor(lifeTime * 6) % 2 === 0) {
        continue;
      }

      // 1. Glowing outer halo
      const glowGrad = ctx.createRadialGradient(x, currentY, 4, x, currentY, item.radius * 1.8);
      glowGrad.addColorStop(0, type.aura);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(x, currentY, item.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 2. Translucent capsule container
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, currentY, item.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 3. Icon
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(type.icon, x, currentY + 1);

      // 4. Subtle orbiting star
      const orbitX = x + Math.cos(item.rotation) * (item.radius + 5);
      const orbitY = currentY + Math.sin(item.rotation) * (item.radius + 5);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(orbitX, orbitY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Global powerup manager
window.powerUpManager = new PowerUpManager();
