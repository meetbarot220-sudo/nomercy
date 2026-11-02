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

    if (this.isTouchDevice) {
      document.body.classList.add('has-touch');
    }

    // Multi-touch tracking: pointerId -> action
    this.activePointers = new Map();

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
  // Rock-solid multi-touch support using Pointer Capture and fallback Touch Tracking
  initTouchControls() {
    const mobileContainer = document.getElementById('mobile-controls');
    if (!mobileContainer) return;

    // Strictly hide on PC/desktop without touch
    if (!this.isTouchDevice) {
      mobileContainer.classList.add('hidden');
      return;
    }

    // Show touch UI for mobile/touch users
    mobileContainer.classList.remove('hidden');

    const touchButtons = mobileContainer.querySelectorAll('.touch-btn');

    touchButtons.forEach(btn => {
      const action = btn.dataset.key;

      // Pointer event handlers with pointer capture for true multi-touch
      const handlePointerDown = (e) => {
        e.preventDefault();
        if (window.soundEngine) window.soundEngine.ensureContext();

        try {
          btn.setPointerCapture(e.pointerId);
        } catch (_) {}

        this.activePointers.set(e.pointerId, { action, btn });
        btn.classList.add('active');
        this.setVirtualAction(action, true);
      };

      const handlePointerUp = (e) => {
        e.preventDefault();
        try {
          btn.releasePointerCapture(e.pointerId);
        } catch (_) {}

        this.activePointers.delete(e.pointerId);

        // Check if any other pointer is holding this action
        let stillHeld = false;
        for (const [, data] of this.activePointers.entries()) {
          if (data.action === action) {
            stillHeld = true;
            break;
          }
        }

        if (!stillHeld) {
          btn.classList.remove('active');
          this.setVirtualAction(action, false);
        }
      };

      btn.addEventListener('pointerdown', handlePointerDown);
      btn.addEventListener('pointerup', handlePointerUp);
      btn.addEventListener('pointercancel', handlePointerUp);

      // Fallback touch events for environments without full pointer-capture
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (window.soundEngine) window.soundEngine.ensureContext();
        btn.classList.add('active');
        this.setVirtualAction(action, true);
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
        this.setVirtualAction(action, false);
      }, { passive: false });

      btn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
        this.setVirtualAction(action, false);
      }, { passive: false });
    });
  }

  // Reset all input states
  reset() {
    this.keys = {};
    this.justPressed = {};
    if (this.activePointers) this.activePointers.clear();
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
