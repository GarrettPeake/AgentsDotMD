/**
 * Hash-based SPA router.
 * Maps hash paths to web component tag names and renders them into an outlet element.
 */
class Router {
  constructor(outlet) {
    this.outlet = outlet;
    this.routes = new Map();
    this._onHashChange = () => this._resolve();
  }

  register(hash, componentTag) {
    this.routes.set(hash, componentTag);
    return this;
  }

  _resolve() {
    const hash = location.hash.slice(1) || '/';
    const tag = this.routes.get(hash);
    if (tag) {
      this.outlet.innerHTML = '';
      this.outlet.appendChild(document.createElement(tag));
    }
  }

  start() {
    window.addEventListener('hashchange', this._onHashChange);
    this._resolve();
  }

  navigate(hash) {
    location.hash = hash;
  }
}

export default Router;
