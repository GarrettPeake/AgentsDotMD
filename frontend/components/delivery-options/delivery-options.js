/**
 * DeliveryOptions — Export step with delivery mode selection.
 * Provides radio cards for choosing download-as-zip, inline instructions,
 * or copy-paste prompt mode. Handles the primary action (download/copy)
 * and navigation to GitHub commit flow.
 */
import { store } from '../../js/store.js';
import { eventBus, TOAST_SHOW, NAVIGATE } from '../../js/event-bus.js';
import { generate, generateInlineMode, generateCopyPasteMode } from '../../js/generator.js';
import { downloadZip } from '../../js/zip-builder.js';
import { isAuthenticated } from '../../js/github-auth.js';

export class DeliveryOptions extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._unsubscribers = [];
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./delivery-options.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./delivery-options.css', import.meta.url)).then(r => r.text())
    ]);

    const style = document.createElement('style');
    style.textContent = css;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.shadowRoot.append(style, template.content.cloneNode(true));

    this._bind();
    this._syncModeFromStore();
    this._renderSummary();
  }

  disconnectedCallback() {
    for (const unsub of this._unsubscribers) {
      unsub();
    }
    this._unsubscribers = [];
  }

  _bind() {
    // Mode radio cards
    var radios = this.shadowRoot.querySelectorAll('[name="delivery-mode"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener('change', this._onModeChange.bind(this));
    }

    // Primary action button
    var primaryBtn = this.shadowRoot.querySelector('[data-primary-action]');
    if (primaryBtn) {
      primaryBtn.addEventListener('click', this._onPrimaryAction.bind(this));
    }

    // GitHub commit button
    var githubBtn = this.shadowRoot.querySelector('[data-github-action]');
    if (githubBtn) {
      githubBtn.addEventListener('click', this._onGithubAction.bind(this));
    }

    // Back button
    var backBtn = this.shadowRoot.querySelector('[data-back-action]');
    if (backBtn) {
      backBtn.addEventListener('click', this._onBackAction.bind(this));
    }

    // Subscribe to store changes
    var unsubMode = store.subscribe('deliveryMode', this._syncModeFromStore.bind(this));
    this._unsubscribers.push(unsubMode);

    var unsubTechs = store.subscribe('selectedTechIds', this._renderSummary.bind(this));
    this._unsubscribers.push(unsubTechs);

    var unsubTemplates = store.subscribe('templateFiles', this._renderSummary.bind(this));
    this._unsubscribers.push(unsubTemplates);
  }

  /**
   * Syncs radio selection and primary button label to the current store mode.
   */
  _syncModeFromStore() {
    var mode = store.get('deliveryMode') || 'download';
    var radios = this.shadowRoot.querySelectorAll('[name="delivery-mode"]');

    for (var i = 0; i < radios.length; i++) {
      radios[i].checked = (radios[i].value === mode);
    }

    this._updatePrimaryLabel(mode);
  }

  /**
   * Updates the primary action button label based on mode.
   */
  _updatePrimaryLabel(mode) {
    var label = this.shadowRoot.querySelector('[data-primary-label]');
    if (!label) {
      return;
    }

    if (mode === 'download') {
      label.textContent = 'Download';
    } else if (mode === 'inline') {
      label.textContent = 'Download';
    } else if (mode === 'copypaste') {
      label.textContent = 'Copy to Clipboard';
    }
  }

  /**
   * Handles delivery mode radio change.
   */
  _onModeChange(event) {
    var mode = event.target.value;
    store.set('deliveryMode', mode);
    this._updatePrimaryLabel(mode);
  }

  /**
   * Handles primary action button click.
   * Dispatches the appropriate generation and delivery action.
   */
  async _onPrimaryAction() {
    var mode = store.get('deliveryMode') || 'download';

    try {
      if (mode === 'download') {
        generate();
        await downloadZip();
        eventBus.emit(TOAST_SHOW, { message: 'Zip downloaded successfully.', type: 'success' });

      } else if (mode === 'inline') {
        var inlineContent = generateInlineMode();
        this._downloadTextFile(inlineContent);
        eventBus.emit(TOAST_SHOW, { message: 'File downloaded successfully.', type: 'success' });

      } else if (mode === 'copypaste') {
        var promptContent = generateCopyPasteMode();
        await this._copyToClipboard(promptContent);
        eventBus.emit(TOAST_SHOW, { message: 'Copied to clipboard.', type: 'success' });
      }

    } catch (err) {
      eventBus.emit(TOAST_SHOW, { message: 'Export failed. Please try again.', type: 'error' });
    }
  }

  /**
   * Triggers a text file download via a temporary link.
   */
  _downloadTextFile(content) {
    var filename = store.get('filename') || 'AGENTS.md';
    var blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Copies text to the clipboard using the Clipboard API.
   */
  async _copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * Navigates to the GitHub commit flow.
   */
  _onGithubAction() {
    generate();
    eventBus.emit(NAVIGATE, '#/github-commit');
  }

  /**
   * Navigates back to the preview step.
   */
  _onBackAction() {
    eventBus.emit(NAVIGATE, '#/preview');
  }

  /**
   * Renders the summary section showing selected technologies and file counts.
   */
  _renderSummary() {
    var summaryList = this.shadowRoot.querySelector('[data-summary-list]');
    var summaryEmpty = this.shadowRoot.querySelector('[data-summary-empty]');
    var summaryBox = this.shadowRoot.querySelector('[data-summary-box]');

    if (!summaryList || !summaryBox) {
      return;
    }

    var selectedTechIds = store.get('selectedTechIds') || [];
    var technologies = store.get('technologies') || [];
    var templateFiles = store.get('templateFiles') || [];
    var filename = store.get('filename') || 'AGENTS.md';

    // Clear existing list items
    while (summaryList.firstChild) {
      summaryList.removeChild(summaryList.firstChild);
    }

    if (selectedTechIds.length === 0) {
      if (summaryEmpty) {
        summaryEmpty.removeAttribute('hidden');
      }
      summaryList.setAttribute('hidden', '');
      return;
    }

    if (summaryEmpty) {
      summaryEmpty.setAttribute('hidden', '');
    }
    summaryList.removeAttribute('hidden');

    // Add the generated markdown file entry
    var mdItem = document.createElement('li');
    mdItem.className = 'summary-item';
    var mdIcon = document.createElement('span');
    mdIcon.className = 'summary-item-icon';
    mdIcon.textContent = '>';
    mdItem.appendChild(mdIcon);
    var mdText = document.createTextNode(filename);
    mdItem.appendChild(mdText);
    summaryList.appendChild(mdItem);

    // Add template file entries
    for (var i = 0; i < templateFiles.length; i++) {
      var item = document.createElement('li');
      item.className = 'summary-item';
      var icon = document.createElement('span');
      icon.className = 'summary-item-icon';
      icon.textContent = '>';
      item.appendChild(icon);
      var text = document.createTextNode(templateFiles[i].outputPath || templateFiles[i].sourcePath || '');
      item.appendChild(text);
      summaryList.appendChild(item);
    }

    // Add count line
    var selectedTechs = technologies.filter(function(t) {
      return selectedTechIds.indexOf(t.id) !== -1;
    });
    var techNames = selectedTechs.map(function(t) { return t.name; }).join(', ');
    var totalFiles = 1 + templateFiles.length;

    var countEl = document.createElement('li');
    countEl.className = 'summary-count';
    countEl.textContent = totalFiles + (totalFiles === 1 ? ' file' : ' files') + ' — ' + techNames;
    summaryList.appendChild(countEl);
  }
}

customElements.define('delivery-options', DeliveryOptions);
