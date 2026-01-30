/**
 * App root layout shell.
 * Provides header with navigation, router outlet, and footer.
 */
export class AppRoot extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./app-root.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./app-root.css', import.meta.url)).then(r => r.text())
    ]);

    const style = document.createElement('style');
    style.textContent = css;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.shadowRoot.append(style, template.content.cloneNode(true));
  }
}

customElements.define('app-root', AppRoot);
