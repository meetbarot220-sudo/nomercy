/* ============================================================
   SQUISH BRAWL - UNIFIED INPUT CONTROLLER
   Desktop Keyboard/Mouse + Pure Mobile Touch Layer with Multi-Touch
   ============================================================ */

class InputController {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.prevKeys = {};

    // Multi-touch tracking: pointerId -> action
    this.activePointers = new Map();

    // Touch device detection
    this.isTouchDevice = this.detectTouchDevice();

    if (this.isTouchDevice) {
      this.enableTouch();
    } else {
      // Setup dynamic touch activation: if a touch/pen interaction occurs, immediately enable touch controls
      const onTouchDetected = (e) => {
        if (e.type === 'touchstart' || (e.pointerType && e.pointerType === 'touch')) {
          this.enableTouch();
          window.removeEventListener('touchstart', onTouchDetected);
          window.removeEventListener('pointerdown', onTouchDetected);
        }
      };
      window.addEventListener('touchstart', onTouchDetected, { passive: true });
      window.addEventListener('pointerdown', onTouchDetected, { passive: true });
    }

    this.initKeyboard();
    this.initTouchControls();
  }

  detectTouchDevice() {
    const hasTouchApi = (
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0))
    );
    const hasCoarsePointer = (
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      (window.matchMedia && window.matchMedia('(any-pointer: coarse)').matches)
    );
    const isMobileAgent = (
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
    return hasTouchApi || hasCoarsePointer || isMobileAgent;
  }

  enableTouch() {
    this.isTouchDevice = true;
    document.body.classList.add('has-touch');
    const mobileContainer = document.getElementById('mobile-controls');
    if (mobileContainer && !document.body.classList.contains('game-over')) {
      mobileContainer.classList.remove('hidden');
    }
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

    // Mouse Attack for desktop
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('.modal-card')) return;
      if (window.soundEngine) window.soundEngine.ensureContext();

      if (e.button === 0) {
        if (window.gameEngine && (window.gameEngine.state === 'TITLE' || window.gameEngine.state === 'WAITING_START')) {
          return; // Do NOT trigger attack on the starting click!
        }
        this.setVirtualAction('attack', true);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.setVirtualAction('attack', false);
      }
    });

    window.addEventListener('contextmenu', (e) => {
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
  // Guaranteed multi-touch support using Pointer Capture and fallback touch events
  initTouchControls() {
    const mobileContainer = document.getElementById('mobile-controls');
    if (!mobileContainer) return;

    // Determine desktop vs mobile touch status
    const isDesktopOnly = !this.isTouchDevice && window.matchMedia && window.matchMedia('(pointer: fine) and (hover: hover)').matches;

    if (isDesktopOnly) {
      mobileContainer.classList.add('hidden');
    } else {
      this.enableTouch();
    }

    // ALWAYS attach listeners to all touch buttons
    const touchButtons = mobileContainer.querySelectorAll('.touch-btn');

    touchButtons.forEach(btn => {
      const action = btn.dataset.key;
      if (!action) return;

      const pressAction = (pointerId) => {
        if (window.soundEngine) window.soundEngine.ensureContext();
        if (pointerId !== undefined) {
          this.activePointers.set(pointerId, action);
        }
        btn.classList.add('active');
        this.setVirtualAction(action, true);
      };

      const releaseAction = (pointerId) => {
        if (pointerId !== undefined) {
          this.activePointers.delete(pointerId);
        }
        // Check if any other active pointer is holding this action
        let stillHeld = false;
        for (const act of this.activePointers.values()) {
          if (act === action) {
            stillHeld = true;
            break;
          }
        }
        if (!stillHeld) {
          btn.classList.remove('active');
          this.setVirtualAction(action, false);
        }
      };

      // 1. Pointer Events (Standard across modern touch devices)
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try {
          btn.setPointerCapture(e.pointerId);
        } catch (_) {}
        pressAction(e.pointerId);
      });

      btn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        try {
          btn.releasePointerCapture(e.pointerId);
        } catch (_) {}
        releaseAction(e.pointerId);
      });

      btn.addEventListener('pointercancel', (e) => {
        e.preventDefault();
        try {
          btn.releasePointerCapture(e.pointerId);
        } catch (_) {}
        releaseAction(e.pointerId);
      });

      btn.addEventListener('lostpointercapture', (e) => {
        releaseAction(e.pointerId);
      });

      // 2. Touch event fallbacks for legacy or non-pointer touch environments
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          pressAction(`touch_${e.changedTouches[i].identifier}`);
        }
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          releaseAction(`touch_${e.changedTouches[i].identifier}`);
        }
      }, { passive: false });

      btn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          releaseAction(`touch_${e.changedTouches[i].identifier}`);
        }
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
