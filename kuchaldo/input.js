/* ============================================================
   SQUISH BRAWL - UNIFIED INPUT CONTROLLER
   Desktop Keyboard/Mouse + Pure Mobile Touch Layer with Multi-Touch
   ============================================================ */

class InputController {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.prevKeys = {};

    // Touch device detection: true if touch capability is present
    this.isTouchDevice = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );

    // Track active touch identifiers per button
    this.activeTouches = new Map(); // buttonElement -> Set of pointerIds

    this.initKeyboard();
    this.initTouchControls();
  }

  // --- KEYBOARD & MOUSE LISTENER ---
  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Audio unlock on user interaction
      if (window.soundEngine) {
        window.soundEngine.ensureContext();
      }

      const code = e.code;

      // Prevent scrolling with arrows/space
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }

      this.mapKey(code, true);

      // Shortcut toggles
      if (code === 'KeyM') {
        const enabled = window.soundEngine.toggleSound();
        const btn = document.getElementById('btn-sound');
        if (btn) btn.textContent = enabled ? '🔊' : '🔇';
      } else if (code === 'KeyB') {
        const enabled = window.soundEngine.toggleMusic();
        const btn = document.getElementById('btn-music');
        if (btn) btn.textContent = enabled ? '🎵' : '🔇';
      }
    });

    window.addEventListener('keyup', (e) => {
      this.mapKey(e.code, false);
    });

    // Mouse Attack
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('.modal-card')) return;
      if (window.soundEngine) window.soundEngine.ensureContext();

      if (e.button === 0) {
        this.setVirtualAction('attack', true);
      } else if (e.button === 2) {
        this.setVirtualAction('dash', true);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.setVirtualAction('attack', false);
      } else if (e.button === 2) {
        this.setVirtualAction('dash', false);
      }
    });

    window.addEventListener('contextmenu', (e) => {
      // Prevent context menu in game canvas
      if (e.target.id === 'game-canvas') {
        e.preventDefault();
      }
    });
  }

  mapKey(code, isDown) {
    // Movement
    if (code === 'KeyA' || code === 'ArrowLeft') {
      this.setVirtualAction('left', isDown);
    }
    if (code === 'KeyD' || code === 'ArrowRight') {
      this.setVirtualAction('right', isDown);
    }
    if (code === 'KeyS' || code === 'ArrowDown') {
      this.setVirtualAction('down', isDown);
    }

    // Jump
    if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
      this.setVirtualAction('jump', isDown);
    }

    // Attack
    if (code === 'KeyJ' || code === 'KeyX' || code === 'KeyF') {
      this.setVirtualAction('attack', isDown);
    }

    // Dash
    if (code === 'KeyK' || code === 'ShiftLeft' || code === 'ShiftRight') {
      this.setVirtualAction('dash', isDown);
    }

    // Enter / Restart
    if (code === 'Enter') {
      this.setVirtualAction('start', isDown);
    }
  }

  setVirtualAction(action, isDown) {
    if (isDown && !this.keys[action]) {
      this.justPressed[action] = true;
    }
    this.keys[action] = isDown;
  }

  // --- MOBILE ON-SCREEN TOUCH BUTTONS ---
  initTouchControls() {
    const mobileContainer = document.getElementById('mobile-controls');
    if (!mobileContainer) return;

    // IMPORTANT: strictly hide on PC/desktop without touch
    if (!this.isTouchDevice) {
      mobileContainer.classList.add('hidden');
      return;
    }

    // Show touch UI for mobile/touch users
    mobileContainer.classList.remove('hidden');

    const touchButtons = mobileContainer.querySelectorAll('.touch-btn');

    touchButtons.forEach(btn => {
      const action = btn.dataset.key;

      const handleStart = (e) => {
        e.preventDefault();
        if (window.soundEngine) window.soundEngine.ensureContext();

        btn.classList.add('active');
        this.setVirtualAction(action, true);
      };

      const handleEnd = (e) => {
        e.preventDefault();
        btn.classList.remove('active');
        this.setVirtualAction(action, false);
      };

      btn.addEventListener('pointerdown', handleStart);
      btn.addEventListener('pointerup', handleEnd);
      btn.addEventListener('pointercancel', handleEnd);
      btn.addEventListener('pointerleave', handleEnd);

      // Touch events fallback for compatibility
      btn.addEventListener('touchstart', handleStart, { passive: false });
      btn.addEventListener('touchend', handleEnd, { passive: false });
      btn.addEventListener('touchcancel', handleEnd, { passive: false });
    });
  }

  // Reset all input states
  reset() {
    this.keys = {};
    this.justPressed = {};
    if (this.activeTouches) this.activeTouches.clear();
    const touchButtons = document.querySelectorAll('.touch-btn');
    touchButtons.forEach(btn => btn.classList.remove('active'));
  }

  // --- QUERY METHODS ---
  isDown(action) {
    return !!this.keys[action];
  }

  isJustPressed(action) {
    return !!this.justPressed[action];
  }

  // Clear single-frame triggers at end of game tick
  endFrame() {
    this.justPressed = {};
  }
}

// Global input singleton
window.input = new InputController();
