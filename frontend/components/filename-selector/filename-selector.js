/**
 * FilenameSelector — Dropdown for choosing the output filename.
 * Offers AGENTS.md, CLAUDE.md, COPILOT.md, or a custom filename.
 * Stores the selected filename in the reactive store.
 */
import { store } from '../../js/store.js';

const PRESET_VALUES = ['AGENTS.md', 'CLAUDE.md', 'COPILOT.md'];
const CUSTOM_SENTINEL = '__custom__';

export class FilenameSelector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._unsubscribers = [];
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./filename-selector.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./filename-selector.css', import.meta.url)).then(r => r.text())
    ]);

    const style = document.createElement('style');
    style.textContent = css;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.shadowRoot.append(style, template.content.cloneNode(true));

    this._bind();
    this._syncFromStore();
  }

  disconnectedCallback() {
    for (const unsub of this._unsubscribers) {
      unsub();
    }
    this._unsubscribers = [];
  }

  _bind() {
    var select = this.shadowRoot.querySelector('[data-filename-select]');
    var customInput = this.shadowRoot.querySelector('[data-custom-input]');

    if (select) {
      select.addEventListener('change', this._onSelectChange.bind(this));
    }

    if (customInput) {
      customInput.addEventListener('input', this._onCustomInput.bind(this));
    }

    var unsub = store.subscribe('filename', this._syncFromStore.bind(this));
    this._unsubscribers.push(unsub);
  }

  /**
   * Syncs the UI to reflect the current store filename value.
   */
  _syncFromStore() {
    var select = this.shadowRoot.querySelector('[data-filename-select]');
    var customWrapper = this.shadowRoot.querySelector('[data-custom-wrapper]');
    var customInput = this.shadowRoot.querySelector('[data-custom-input]');

    if (!select) {
      return;
    }

    var currentFilename = store.get('filename') || 'AGENTS.md';

    if (PRESET_VALUES.indexOf(currentFilename) !== -1) {
      select.value = currentFilename;
      if (customWrapper) {
        customWrapper.setAttribute('hidden', '');
      }
    } else {
      select.value = CUSTOM_SENTINEL;
      if (customWrapper) {
        customWrapper.removeAttribute('hidden');
      }
      if (customInput) {
        customInput.value = currentFilename;
      }
    }
  }

  /**
   * Handles select dropdown change.
   */
  _onSelectChange(event) {
    var value = event.target.value;
    var customWrapper = this.shadowRoot.querySelector('[data-custom-wrapper]');
    var customInput = this.shadowRoot.querySelector('[data-custom-input]');

    if (value === CUSTOM_SENTINEL) {
      if (customWrapper) {
        customWrapper.removeAttribute('hidden');
      }
      if (customInput) {
        customInput.focus();
        var customValue = customInput.value.trim();
        if (customValue) {
          store.set('filename', customValue);
        }
      }
    } else {
      if (customWrapper) {
        customWrapper.setAttribute('hidden', '');
      }
      store.set('filename', value);
    }
  }

  /**
   * Handles custom text input changes.
   */
  _onCustomInput(event) {
    var value = event.target.value.trim();
    if (value) {
      store.set('filename', value);
    }
  }
}

customElements.define('filename-selector', FilenameSelector);
