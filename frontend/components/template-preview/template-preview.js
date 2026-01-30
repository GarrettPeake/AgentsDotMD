/**
 * TemplatePreview — Displays template/boilerplate files for selected technologies.
 * Renders each template file as a collapsible entry showing file path and content.
 * Variable placeholders ({{variable}}) are highlighted in the display.
 */
import { store } from '../../js/store.js';

export class TemplatePreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._unsubscribers = [];
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./template-preview.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./template-preview.css', import.meta.url)).then(r => r.text())
    ]);

    const style = document.createElement('style');
    style.textContent = css;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.shadowRoot.append(style, template.content.cloneNode(true));

    this._bind();
    this._render();
  }

  disconnectedCallback() {
    for (const unsub of this._unsubscribers) {
      unsub();
    }
    this._unsubscribers = [];
  }

  _bind() {
    var unsubTemplates = store.subscribe('templateFiles', this._render.bind(this));
    this._unsubscribers.push(unsubTemplates);
  }

  /**
   * Renders all template files from the store.
   */
  _render() {
    var list = this.shadowRoot.querySelector('[data-template-list]');
    var emptyState = this.shadowRoot.querySelector('[data-empty-state]');
    if (!list) {
      return;
    }

    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    var templateFiles = store.get('templateFiles') || [];

    if (templateFiles.length === 0) {
      if (emptyState) {
        emptyState.removeAttribute('hidden');
      }
      return;
    }

    if (emptyState) {
      emptyState.setAttribute('hidden', '');
    }

    var tpl = this.shadowRoot.querySelector('[data-template-file-entry]');
    if (!tpl) {
      return;
    }

    for (var i = 0; i < templateFiles.length; i++) {
      var file = templateFiles[i];
      var clone = tpl.content.cloneNode(true);
      var entry = clone.querySelector('.file-entry');
      var filePath = clone.querySelector('[data-file-path]');
      var fileCode = clone.querySelector('[data-file-code]');
      var fileToggle = clone.querySelector('[data-file-toggle]');
      var fileContent = clone.querySelector('[data-file-content]');
      var toggleIndicator = clone.querySelector('[data-toggle-indicator]');

      var outputPath = file.outputPath || file.sourcePath || '';
      var content = file.content || '';

      if (filePath) {
        filePath.textContent = outputPath;
      }

      // Render content with variable placeholders highlighted
      if (fileCode) {
        this._renderHighlightedContent(fileCode, content);
      }

      // Bind toggle expand/collapse
      if (fileToggle && entry && fileContent && toggleIndicator) {
        fileToggle.addEventListener('click',
          this._handleToggle.bind(this, entry, fileContent, toggleIndicator)
        );
      }

      list.appendChild(clone);
    }
  }

  /**
   * Renders template content with {{variable}} placeholders highlighted.
   * Creates text nodes and span elements without using innerHTML.
   */
  _renderHighlightedContent(codeEl, content) {
    while (codeEl.firstChild) {
      codeEl.removeChild(codeEl.firstChild);
    }

    var regex = /\{\{([^}]+)\}\}/g;
    var lastIndex = 0;
    var match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        var textBefore = document.createTextNode(content.substring(lastIndex, match.index));
        codeEl.appendChild(textBefore);
      }

      // Add highlighted placeholder
      var span = document.createElement('span');
      span.className = 'var-placeholder';
      span.textContent = match[0];
      codeEl.appendChild(span);

      lastIndex = regex.lastIndex;
    }

    // Add remaining text after last match
    if (lastIndex < content.length) {
      var remaining = document.createTextNode(content.substring(lastIndex));
      codeEl.appendChild(remaining);
    }

    // If no matches found and no content was added, set as plain text
    if (lastIndex === 0 && content.length > 0) {
      codeEl.textContent = content;
    }
  }

  /**
   * Toggles expand/collapse of a file entry.
   */
  _handleToggle(entry, fileContent, toggleIndicator) {
    var isExpanded = entry.classList.contains('expanded');

    if (isExpanded) {
      entry.classList.remove('expanded');
      fileContent.setAttribute('hidden', '');
      toggleIndicator.textContent = '+';
    } else {
      entry.classList.add('expanded');
      fileContent.removeAttribute('hidden');
      toggleIndicator.textContent = '-';
    }
  }
}

customElements.define('template-preview', TemplatePreview);
