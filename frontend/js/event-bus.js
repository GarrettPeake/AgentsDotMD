/**
 * Pub/sub event bus for cross-component communication.
 */
class EventBus {
  constructor() {
    this._handlers = new Map();
  }

  on(event, callback) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const handlers = this._handlers.get(event);
    if (handlers) {
      handlers.delete(callback);
    }
  }

  emit(event, data) {
    const handlers = this._handlers.get(event);
    if (handlers) {
      handlers.forEach(cb => cb(data));
    }
  }

  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    return this.on(event, wrapper);
  }
}

export const eventBus = new EventBus();

export const TECH_SELECTED = 'tech:selected';
export const TECH_DESELECTED = 'tech:deselected';
export const OPTIONS_CHANGED = 'options:changed';
export const GENERATION_COMPLETE = 'generation:complete';
export const NAVIGATE = 'navigate';
export const TOAST_SHOW = 'toast:show';
export const AUTH_SUCCESS = 'auth:success';
export const AUTH_LOGOUT = 'auth:logout';
export const CONTRIBUTION_SUBMIT = 'contribution:submit';
