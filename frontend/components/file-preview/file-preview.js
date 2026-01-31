/**
 * FilePreview — Markdown preview with editable fragment blocks.
 * Renders generated markdown as individual fragment blocks that can be
 * edited inline. Supports "Suggest Change" to trigger contribution flow.
 * Subscribes to store changes to regenerate in real-time.
 */
import { store } from '../../js/store.js';
import {
  eventBus,
  GENERATION_COMPLETE,
  OPTIONS_CHANGED,
  NAVIGATE,
  CONTRIBUTION_SUBMIT
} from '../../js/event-bus.js';
import { generate } from '../../js/generator.js';

export class FilePreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._unsubscribers = [];
    this._activeTab = 'generated';
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./file-preview.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./file-preview.css', import.meta.url)).then(r => r.text())
    ]);

    const style = document.createElement('style');
    style.textContent = css;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.shadowRoot.append(style, template.content.cloneNode(true));

    this._bind();
    this._generateAndRender();
  }

  disconnectedCallback() {
    for (const unsub of this._unsubscribers) {
      unsub();
    }
    this._unsubscribers = [];
  }

  _bind() {
    var backBtn = this.shadowRoot.querySelector('[data-back-btn]');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        eventBus.emit(NAVIGATE, '/configure');
      });
    }

    var continueBtn = this.shadowRoot.querySelector('[data-continue-btn]');
    if (continueBtn) {
      continueBtn.addEventListener('click', function () {
        eventBus.emit(NAVIGATE, '/export');
      });
    }

    var regenerateBtn = this.shadowRoot.querySelector('[data-regenerate-btn]');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', this._generateAndRender.bind(this));
    }

    // Tab switching
    var tabBtns = this.shadowRoot.querySelectorAll('[data-tab-btn]');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', this._handleTabSwitch.bind(this, btn));
    }.bind(this));

    // Subscribe to options changes to regenerate
    var unsubOptions = eventBus.on(OPTIONS_CHANGED, this._generateAndRender.bind(this));
    this._unsubscribers.push(unsubOptions);

    // Subscribe to fragments changes
    var unsubFragments = store.subscribe('fragments', this._generateAndRender.bind(this));
    this._unsubscribers.push(unsubFragments);

    // Subscribe to filename changes
    var unsubFilename = store.subscribe('filename', this._updateFilenameDisplay.bind(this));
    this._unsubscribers.push(unsubFilename);
  }

  /**
   * Switches between Generated File and Templates tabs.
   */
  _handleTabSwitch(clickedBtn) {
    var tabName = clickedBtn.getAttribute('data-tab-btn');
    if (tabName === this._activeTab) {
      return;
    }

    this._activeTab = tabName;

    // Update tab button states
    var allBtns = this.shadowRoot.querySelectorAll('[data-tab-btn]');
    allBtns.forEach(function (btn) {
      btn.classList.remove('tab-active');
    });
    clickedBtn.classList.add('tab-active');

    // Update tab panels
    var allPanels = this.shadowRoot.querySelectorAll('[data-tab-panel]');
    allPanels.forEach(function (panel) {
      var panelName = panel.getAttribute('data-tab-panel');
      if (panelName === tabName) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    // If switching to templates tab, render the template-preview component
    if (tabName === 'templates') {
      this._renderTemplatesTab();
    }
  }

  /**
   * Renders the template-preview component inside the templates tab.
   */
  _renderTemplatesTab() {
    var container = this.shadowRoot.querySelector('[data-templates-content]');
    if (!container) {
      return;
    }

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    var templatePreview = document.createElement('template-preview');
    container.appendChild(templatePreview);
  }

  /**
   * Updates the filename display.
   */
  _updateFilenameDisplay() {
    var el = this.shadowRoot.querySelector('[data-filename-display]');
    if (el) {
      el.textContent = store.get('filename') || 'AGENTS.md';
    }
  }

  /**
   * Generates markdown and renders fragment blocks.
   */
  _generateAndRender() {
    generate();
    this._updateFilenameDisplay();
    this._renderFragments();
    eventBus.emit(GENERATION_COMPLETE, { markdown: store.get('generatedMarkdown') });
  }

  /**
   * Renders fragments grouped by technology, each in a collapsible accordion.
   */
  _renderFragments() {
    var container = this.shadowRoot.querySelector('[data-preview-content]');
    if (!container) {
      return;
    }

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    var fragments = store.get('fragments') || [];
    var localEdits = store.get('localEdits') || {};
    var technologies = store.get('technologies') || [];
    var options = store.get('options') || {};
    var fragmentTpl = this.shadowRoot.querySelector('[data-template-fragment-block]');
    var groupTpl = this.shadowRoot.querySelector('[data-template-tech-group]');

    if (!fragmentTpl || !groupTpl) {
      return;
    }

    // Filter fragments the same way the generator does
    var filtered = this._filterFragments(fragments, options);

    // Group fragments by technology
    var groups = [];
    var groupMap = {};
    for (var i = 0; i < filtered.length; i++) {
      var frag = filtered[i];
      var techId = (frag.metadata && frag.metadata.technology) || 'unknown';
      if (!groupMap[techId]) {
        groupMap[techId] = { techId: techId, fragments: [] };
        groups.push(groupMap[techId]);
      }
      groupMap[techId].fragments.push(frag);
    }

    var isFirstGroup = true;
    for (var g = 0; g < groups.length; g++) {
      var group = groups[g];
      var tech = technologies.find(function (t) { return t.id === group.techId; });
      var techName = tech ? tech.name : group.techId;

      var groupClone = groupTpl.content.cloneNode(true);
      var groupEl = groupClone.querySelector('[data-tech-group]');
      var groupHeader = groupClone.querySelector('[data-tech-group-header]');
      var groupNameEl = groupClone.querySelector('[data-tech-group-name]');
      var groupCountEl = groupClone.querySelector('[data-tech-group-count]');
      var groupBody = groupClone.querySelector('[data-tech-group-body]');
      var groupArrow = groupClone.querySelector('[data-group-arrow]');

      if (groupNameEl) {
        groupNameEl.textContent = techName;
      }
      if (groupCountEl) {
        groupCountEl.textContent = group.fragments.length + (group.fragments.length === 1 ? ' fragment' : ' fragments');
      }
      if (groupArrow) {
        groupArrow.textContent = '\u25BC';
      }

      // Collapse all groups except the first
      if (!isFirstGroup && groupEl) {
        groupEl.classList.add('collapsed');
      }

      // Toggle collapse on group header click
      if (groupHeader && groupEl) {
        (function (el) {
          groupHeader.addEventListener('click', function () {
            el.classList.toggle('collapsed');
          });
        })(groupEl);
      }

      // Render fragments inside the group
      for (var fi = 0; fi < group.fragments.length; fi++) {
        var fragment = group.fragments[fi];
        var clone = fragmentTpl.content.cloneNode(true);
        var block = clone.querySelector('.fragment-block');
        var categorySpan = clone.querySelector('[data-fragment-category]');
        var codeEl = clone.querySelector('[data-fragment-code]');
        var editBtn = clone.querySelector('[data-edit-btn]');
        var suggestBtn = clone.querySelector('[data-suggest-btn]');
        var editArea = clone.querySelector('[data-edit-area]');
        var displayArea = clone.querySelector('[data-fragment-display]');
        var textarea = clone.querySelector('[data-fragment-textarea]');
        var saveBtn = clone.querySelector('[data-save-btn]');
        var cancelBtn = clone.querySelector('[data-cancel-btn]');
        var editedBadge = clone.querySelector('[data-edited-badge]');

        var fragmentId = fragment.id;
        var category = (fragment.metadata && fragment.metadata.category) || '';

        // Determine content: use local edit if exists, otherwise original
        var content = localEdits[fragmentId] !== undefined
          ? localEdits[fragmentId]
          : fragment.content;
        var isEdited = localEdits[fragmentId] !== undefined;

        if (block) {
          block.setAttribute('data-fragment-id', fragmentId);
          if (isEdited) {
            block.classList.add('edited');
          }
        }

        if (categorySpan) {
          categorySpan.textContent = category;
        }

        if (codeEl) {
          codeEl.textContent = content;
        }

        if (editedBadge && isEdited) {
          editedBadge.removeAttribute('hidden');
        }

        // Bind edit button
        if (editBtn) {
          editBtn.addEventListener('click',
            this._handleEditClick.bind(this, block, displayArea, editArea, textarea, content)
          );
        }

        // Bind save button
        if (saveBtn) {
          saveBtn.addEventListener('click',
            this._handleSaveClick.bind(this, fragmentId, block, displayArea, editArea, textarea, codeEl, editedBadge, fragment)
          );
        }

        // Bind cancel button
        if (cancelBtn) {
          cancelBtn.addEventListener('click',
            this._handleCancelClick.bind(this, displayArea, editArea, textarea)
          );
        }

        // Bind suggest change button
        if (suggestBtn) {
          suggestBtn.addEventListener('click',
            this._handleSuggestClick.bind(this, fragment, textarea, displayArea, editArea)
          );
        }

        if (groupBody) {
          groupBody.appendChild(clone);
        }
      }

      container.appendChild(groupClone);
      isFirstGroup = false;
    }
  }

  /**
   * Filters fragments based on option dependencies (mirrors generator logic).
   */
  _filterFragments(fragments, options) {
    return fragments.filter(function (fragment) {
      var deps = fragment.metadata && fragment.metadata.optionDependencies;
      if (!deps || typeof deps !== 'object') {
        return true;
      }

      var keys = Object.keys(deps);
      for (var k = 0; k < keys.length; k++) {
        var optionId = keys[k];
        var requiredValue = deps[optionId];
        var techId = fragment.metadata.technology;
        var techOptions = options[techId] || {};
        var currentValue = techOptions[optionId];

        if (Array.isArray(requiredValue)) {
          if (requiredValue.indexOf(currentValue) === -1) {
            return false;
          }
        } else if (currentValue !== requiredValue) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Handles click on the Edit button for a fragment.
   */
  _handleEditClick(block, displayArea, editArea, textarea, content) {
    if (displayArea) {
      displayArea.setAttribute('hidden', '');
    }
    if (editArea) {
      editArea.removeAttribute('hidden');
    }
    if (textarea) {
      textarea.value = content;
      textarea.focus();
    }
  }

  /**
   * Handles click on the Save button after editing.
   */
  _handleSaveClick(fragmentId, block, displayArea, editArea, textarea, codeEl, editedBadge, fragment) {
    var newContent = textarea ? textarea.value : '';
    var localEdits = store.get('localEdits') || {};

    // Only mark as edited if content differs from original
    if (newContent !== fragment.content) {
      localEdits[fragmentId] = newContent;
      if (block) {
        block.classList.add('edited');
      }
      if (editedBadge) {
        editedBadge.removeAttribute('hidden');
      }
    } else {
      delete localEdits[fragmentId];
      if (block) {
        block.classList.remove('edited');
      }
      if (editedBadge) {
        editedBadge.setAttribute('hidden', '');
      }
    }

    store.set('localEdits', localEdits);

    // Update the displayed content
    if (codeEl) {
      codeEl.textContent = newContent;
    }

    // Switch back to display mode
    if (editArea) {
      editArea.setAttribute('hidden', '');
    }
    if (displayArea) {
      displayArea.removeAttribute('hidden');
    }

    // Regenerate the full markdown
    generate();
    eventBus.emit(GENERATION_COMPLETE, { markdown: store.get('generatedMarkdown') });
  }

  /**
   * Handles click on the Cancel button during editing.
   */
  _handleCancelClick(displayArea, editArea, textarea) {
    if (editArea) {
      editArea.setAttribute('hidden', '');
    }
    if (displayArea) {
      displayArea.removeAttribute('hidden');
    }
  }

  /**
   * Handles click on the Suggest Change button.
   */
  _handleSuggestClick(fragment, textarea, displayArea, editArea) {
    var localEdits = store.get('localEdits') || {};
    var editedContent = localEdits[fragment.id];

    // If currently in edit mode, use textarea value
    if (editArea && !editArea.hasAttribute('hidden') && textarea) {
      editedContent = textarea.value;
    }

    eventBus.emit(CONTRIBUTION_SUBMIT, {
      fragment: fragment,
      originalContent: fragment.content,
      editedContent: editedContent || fragment.content,
      fragmentId: fragment.id,
      technology: (fragment.metadata && fragment.metadata.technology) || '',
      category: (fragment.metadata && fragment.metadata.category) || ''
    });
  }
}

customElements.define('file-preview', FilePreview);
