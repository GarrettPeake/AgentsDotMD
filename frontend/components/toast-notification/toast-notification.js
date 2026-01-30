/**
 * Toast notification component.
 * Displays temporary feedback messages triggered via the event bus.
 */
import { eventBus, TOAST_SHOW } from '../../js/event-bus.js';

export class ToastNotification extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hideTimeout = null;
    this._unsubscribeToast = null;
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./toast-notification.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./toast-notification.css', import.meta.url)).then(r => r.text())
    ]);

    const style = document.createElement('style');
    style.textContent = css;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.shadowRoot.append(style, template.content.cloneNode(true));

    this._bind();
  }

  disconnectedCallback() {
    if (this._unsubscribeToast) {
      this._unsubscribeToast();
      this._unsubscribeToast = null;
    }
    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
    }
  }

  _bind() {
    const closeBtn = this.shadowRoot.querySelector('[data-toast-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this._hide());
    }

    this._unsubscribeToast = eventBus.on(TOAST_SHOW, (data) => {
      const message = data.message || '';
      const type = data.type || 'info';
      const duration = data.duration !== undefined ? data.duration : 3000;
      this.show(message, type, duration);
    });
  }

  show(message, type, duration) {
    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }

    const container = this.shadowRoot.querySelector('[data-toast-container]');
    const messageEl = this.shadowRoot.querySelector('[data-toast-message]');

    if (!container || !messageEl) {
      return;
    }

    messageEl.textContent = message;
    container.setAttribute('data-type', type);
    container.removeAttribute('hidden');

    container.classList.remove('slide-out', 'slide-in');
    void container.offsetWidth;
    container.classList.add('slide-in');

    if (duration > 0) {
      this._hideTimeout = setTimeout(() => this._hide(), duration);
    }
  }

  _hide() {
    const container = this.shadowRoot.querySelector('[data-toast-container]');
    if (!container) {
      return;
    }

    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }

    container.classList.remove('slide-in');
    container.classList.add('slide-out');

    container.addEventListener('animationend', () => {
      container.setAttribute('hidden', '');
      container.classList.remove('slide-out');
    }, { once: true });
  }
}

customElements.define('toast-notification', ToastNotification);
