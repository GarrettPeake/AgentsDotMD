/**
 * Workspace — Single-page layout combining tech selection, options, and live preview.
 * Replaces the multi-step wizard with a side-by-side layout where the left panel
 * has tech selection and options, and the right panel shows assembled markdown output
 * that updates in real-time as selections change.
 */
import { store } from '../../js/store.js';
import { eventBus, NAVIGATE, TOAST_SHOW, OPTIONS_CHANGED, TECH_SELECTED, TECH_DESELECTED } from '../../js/event-bus.js';
import { generate, generateInlineMode, generateCopyPasteMode } from '../../js/generator.js';
import { downloadZip } from '../../js/zip-builder.js';
import { isAuthenticated } from '../../js/github-auth.js';

export class WorkspaceView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._unsubscribers = [];
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./workspace.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./workspace.css', import.meta.url)).then(r => r.text())
    ]);

    const style = document.createElement('style');
    style.textContent = css;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.shadowRoot.append(style, template.content.cloneNode(true));

    this._bind();
    this._updatePreview();
  }

  disconnectedCallback() {
    for (const unsub of this._unsubscribers) {
      unsub();
    }
    this._unsubscribers = [];
  }

  _bind() {
    // Subscribe to selection changes to show/hide options and update preview
    var unsub1 = store.subscribe('selectedTechIds', this._onSelectionChanged.bind(this));
    this._unsubscribers.push(unsub1);

    // Subscribe to fragments changes to update preview
    var unsub2 = store.subscribe('fragments', this._updatePreview.bind(this));
    this._unsubscribers.push(unsub2);

    // Subscribe to options changes to update preview
    var unsub3 = eventBus.on(OPTIONS_CHANGED, this._updatePreview.bind(this));
    this._unsubscribers.push(unsub3);

    // Subscribe to local edits
    var unsub4 = store.subscribe('localEdits', this._updatePreview.bind(this));
    this._unsubscribers.push(unsub4);

    // Subscribe to filename changes
    var unsub5 = store.subscribe('filename', this._updatePreview.bind(this));
    this._unsubscribers.push(unsub5);

    // Bind export buttons
    var copyBtn = this.shadowRoot.querySelector('[data-copy-btn]');
    if (copyBtn) {
      copyBtn.addEventListener('click', this._onCopy.bind(this));
    }

    var downloadBtn = this.shadowRoot.querySelector('[data-download-btn]');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', this._onDownload.bind(this));
    }

    var githubBtn = this.shadowRoot.querySelector('[data-github-btn]');
    if (githubBtn) {
      githubBtn.addEventListener('click', this._onGithub.bind(this));
    }
  }

  _onSelectionChanged() {
    var selectedIds = store.get('selectedTechIds') || [];
    var optionsSection = this.shadowRoot.querySelector('[data-options-section]');

    if (optionsSection) {
      if (selectedIds.length > 0) {
        optionsSection.removeAttribute('hidden');
      } else {
        optionsSection.setAttribute('hidden', '');
      }
    }

    this._updatePreview();
  }

  _updatePreview() {
    var selectedIds = store.get('selectedTechIds') || [];
    var fragments = store.get('fragments') || [];
    var emptyEl = this.shadowRoot.querySelector('[data-preview-empty]');
    var activeEl = this.shadowRoot.querySelector('[data-preview-active]');
    var codeEl = this.shadowRoot.querySelector('[data-markdown-code]');

    if (selectedIds.length === 0 || fragments.length === 0) {
      if (emptyEl) {
        emptyEl.removeAttribute('hidden');
      }
      if (activeEl) {
        activeEl.setAttribute('hidden', '');
      }
      return;
    }

    if (emptyEl) {
      emptyEl.setAttribute('hidden', '');
    }
    if (activeEl) {
      activeEl.removeAttribute('hidden');
    }

    // Generate assembled markdown
    var markdown = generate();
    if (codeEl) {
      codeEl.textContent = markdown;
    }
  }

  async _onCopy() {
    try {
      var markdown = generate();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        var textarea = document.createElement('textarea');
        textarea.value = markdown;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      eventBus.emit(TOAST_SHOW, { message: 'Copied to clipboard.', type: 'success' });
    } catch (err) {
      eventBus.emit(TOAST_SHOW, { message: 'Failed to copy.', type: 'error' });
    }
  }

  async _onDownload() {
    try {
      generate();
      await downloadZip();
      eventBus.emit(TOAST_SHOW, { message: 'Zip downloaded successfully.', type: 'success' });
    } catch (err) {
      eventBus.emit(TOAST_SHOW, { message: 'Download failed.', type: 'error' });
    }
  }

  _onGithub() {
    generate();
    eventBus.emit(NAVIGATE, '/github-commit');
  }
}

customElements.define('workspace-view', WorkspaceView);
