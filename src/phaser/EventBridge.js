// ─────────────────────────────────────────────────────────────
// EventBridge — singleton message bus between React and Phaser
// React owns state → Phaser renders → Phaser forwards input
// ─────────────────────────────────────────────────────────────

class EventBridge {
  constructor() {
    this._listeners = {};
  }

  /** Fire an event with a data payload */
  emit(name, data) {
    const listeners = this._listeners[name];
    if (!listeners) return;
    listeners.forEach(fn => {
      try { fn(data); } catch (e) { console.error(`EventBridge handler error [${name}]:`, e); }
    });
  }

  /** Subscribe to an event */
  on(name, fn) {
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(fn);
  }

  /** Unsubscribe from an event */
  off(name, fn) {
    if (!this._listeners[name]) return;
    this._listeners[name] = this._listeners[name].filter(f => f !== fn);
  }
}

export const eventBridge = new EventBridge();
