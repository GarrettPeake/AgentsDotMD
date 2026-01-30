/**
 * Step wizard component.
 * Displays a 4-step progress indicator for the wizard flow.
 * Listens for route changes via the event bus to update the active step.
 */
import { eventBus, NAVIGATE } from '../../js/event-bus.js';

const HASH_TO_STEP = {
  '/': 1,
  '/configure': 2,
  '/preview': 3,
  '/export': 4
};

export class StepWizard extends HTMLElement {
  static get observedAttributes() {
    return ['active-step'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._unsubscribeNavigate = null;
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./step-wizard.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./step-wizard.css', import.meta.url)).then(r => r.text())
    ]);

    const style = document.createElement('style');
    style.textContent = css;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.shadowRoot.append(style, template.content.cloneNode(true));

    this._bind();
    this._syncStepFromHash();
  }

  disconnectedCallback() {
    if (this._unsubscribeNavigate) {
      this._unsubscribeNavigate();
      this._unsubscribeNavigate = null;
    }
    if (this._onHashChange) {
      window.removeEventListener('hashchange', this._onHashChange);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'active-step' && oldValue !== newValue) {
      this._updateVisualState(parseInt(newValue, 10));
    }
  }

  _bind() {
    this._unsubscribeNavigate = eventBus.on(NAVIGATE, () => {
      requestAnimationFrame(() => this._syncStepFromHash());
    });

    this._onHashChange = () => this._syncStepFromHash();
    window.addEventListener('hashchange', this._onHashChange);
  }

  _syncStepFromHash() {
    const hash = location.hash.slice(1) || '/';
    const step = HASH_TO_STEP[hash] || 1;
    this.setStep(step);
  }

  setStep(n) {
    const step = Math.max(1, Math.min(4, n));
    this.setAttribute('active-step', String(step));
  }

  _updateVisualState(activeStep) {
    const steps = this.shadowRoot.querySelectorAll('.step');
    steps.forEach(stepEl => {
      const stepNum = parseInt(stepEl.getAttribute('data-step'), 10);
      if (stepNum < activeStep) {
        stepEl.setAttribute('data-state', 'completed');
      } else if (stepNum === activeStep) {
        stepEl.setAttribute('data-state', 'active');
      } else {
        stepEl.setAttribute('data-state', 'upcoming');
      }
    });
  }
}

customElements.define('step-wizard', StepWizard);
