/**
 * Reactive state store for AgentsDotMD.
 * Components subscribe to state keys and receive notifications on change.
 */
class Store {
  constructor() {
    this._state = {
      technologies: [],
      selectedTechIds: [],
      options: {},
      fragments: [],
      generatedMarkdown: '',
      templateFiles: [],
      filename: 'AGENTS.md',
      deliveryMode: 'download',
      localEdits: {},
      githubToken: null,
    };
    this._listeners = new Map();
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    this._state[key] = value;
    this._notify(key);
  }

  getAll() {
    return Object.assign({}, this._state);
  }

  subscribe(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(callback);
    return () => this._listeners.get(key).delete(callback);
  }

  _notify(key) {
    const listeners = this._listeners.get(key);
    if (listeners) {
      listeners.forEach(cb => cb(this._state[key]));
    }
  }
}

export const store = new Store();
