/* ============================================================
   SQUISH BRAWL - DYNAMIC SMOOTH ACTION CAMERA
   Smooth target tracking, zoom framing, screen shake, and aspect adaptation
   ============================================================ */

class GameCamera {
  constructor() {
    this.x = 900;
    this.y = 600;
    this.zoom = 1.0;
    this.targetX = 900;
    this.targetY = 600;
    this.targetZoom = 1.0;

    // Smooth lerp factors
    this.posLerp = 0.085;
    this.zoomLerp = 0.05;

    // Shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffset = { x: 0, y: 0 };

    // Viewport dimensions
    this.viewWidth = 1920;
    this.viewHeight = 1080;
  }

  resize(w, h) {
    this.viewWidth = w;
    this.viewHeight = h;
  }

  shake(intensity = 10, duration = 0.25) {
    this.shakeIntensity = Math.min(25, intensity);
    this.shakeDuration = duration;
  }

  update(dt, player, fighters, arena) {
    // 1. Screen Shake decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const angle = Math.random() * Math.PI * 2;
      const dist = (this.shakeDuration / 0.25) * this.shakeIntensity;
      this.shakeOffset.x = Math.cos(angle) * dist;
      this.shakeOffset.y = Math.sin(angle) * dist;
      if (this.shakeDuration <= 0) {
        this.shakeOffset.x = 0;
        this.shakeOffset.y = 0;
      }
    }

    // 2. Determine target camera bounds based on active fighters
    const activeFighters = fighters.filter(f => f.isAlive);

    if (activeFighters.length === 0) {
      this.targetX = 900;
      this.targetY = 600;
      this.targetZoom = 0.85;
    } else {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (const f of activeFighters) {
        if (f.x < minX) minX = f.x;
        if (f.x > maxX) maxX = f.x;
        if (f.y < minY) minY = f.y;
        if (f.y > maxY) maxY = f.y;
      }

      // Bias camera center slightly toward the human player so player is never lost
      let centerX = (minX + maxX) / 2;
      let centerY = (minY + maxY) / 2 - 40;

      if (player && player.isAlive) {
        centerX = centerX * 0.4 + player.x * 0.6;
        centerY = centerY * 0.4 + (player.y - 40) * 0.6;
      }

      this.targetX = centerX;
      this.targetY = centerY;

      // 3. Dynamic Zoom Framing
      const spreadX = Math.max(380, maxX - minX + 280);
      const spreadY = Math.max(260, maxY - minY + 240);

      const zoomX = this.viewWidth / spreadX;
      const zoomY = this.viewHeight / spreadY;
      let idealZoom = Math.min(zoomX, zoomY);

      // Clamp zoom to maintain readability (not too far, not too close)
      idealZoom = Math.max(0.68, Math.min(1.22, idealZoom));
      this.targetZoom = idealZoom;
    }

    // 4. Smooth Lerp
    this.x += (this.targetX - this.x) * (1 - Math.pow(1 - this.posLerp, dt * 60));
    this.y += (this.targetY - this.y) * (1 - Math.pow(1 - this.posLerp, dt * 60));
    this.zoom += (this.targetZoom - this.zoom) * (1 - Math.pow(1 - this.zoomLerp, dt * 60));

    // Clamp camera within soft arena bounds
    this.x = Math.max(200, Math.min(1600, this.x));
    this.y = Math.max(250, Math.min(850, this.y));
  }

  // Apply camera matrix to 2D context
  begin(ctx) {
    ctx.save();
    // Move to center of screen
    ctx.translate(
      this.viewWidth / 2 + this.shakeOffset.x,
      this.viewHeight / 2 + this.shakeOffset.y
    );
    // Apply zoom
    ctx.scale(this.zoom, this.zoom);
    // Translate by camera world position
    ctx.translate(-this.x, -this.y);
  }

  end(ctx) {
    ctx.restore();
  }
}

// Global camera singleton
window.gameCamera = new GameCamera();
