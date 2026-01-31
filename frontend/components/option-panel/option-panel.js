/**
 * OptionPanel — Renders per-technology configuration options.
 * Reads selected technologies from the store, builds option controls
 * from manifest data (single-select, toggle, freeform), manages
 * dependency visibility, and triggers fragment loading on change.
 */
import { store } from '../../js/store.js';
import { eventBus, OPTIONS_CHANGED, NAVIGATE, TOAST_SHOW } from '../../js/event-bus.js';
import { loadFragments, loadCombinationFragments, loadTemplates } from '../../js/prompt-loader.js';

export class OptionPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._unsubscribers = [];
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./option-panel.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./option-panel.css', import.meta.url)).then(r => r.text())
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
    const backBtn = this.shadowRoot.querySelector('[data-back-btn]');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        eventBus.emit(NAVIGATE, '/');
      });
    }

    const continueBtn = this.shadowRoot.querySelector('[data-continue-btn]');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        eventBus.emit(NAVIGATE, '/preview');
      });
    }

    const unsub = store.subscribe('selectedTechIds', () => {
      this._render();
    });
    this._unsubscribers.push(unsub);
  }

  _render() {
    const container = this.shadowRoot.querySelector('[data-options-container]');
    const emptyState = this.shadowRoot.querySelector('[data-empty-state]');
    if (!container) {
      return;
    }

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const selectedIds = store.get('selectedTechIds') || [];
    const technologies = store.get('technologies') || [];

    if (selectedIds.length === 0) {
      if (emptyState) {
        emptyState.removeAttribute('hidden');
      }
      return;
    }

    if (emptyState) {
      emptyState.setAttribute('hidden', '');
    }

    // Initialize options with defaults if not already set
    const currentOptions = store.get('options') || {};

    for (const techId of selectedIds) {
      const tech = technologies.find(t => t.id === techId);
      if (!tech || !tech.options || tech.options.length === 0) {
        continue;
      }

      // Initialize defaults for this tech if missing
      if (!currentOptions[techId]) {
        currentOptions[techId] = {};
      }

      for (const option of tech.options) {
        if (currentOptions[techId][option.id] === undefined) {
          currentOptions[techId][option.id] = this._getDefaultValue(option);
        }
      }

      const fieldset = document.createElement('fieldset');
      const legend = document.createElement('legend');
      const collapseIndicator = document.createElement('span');
      collapseIndicator.classList.add('collapse-indicator');
      collapseIndicator.textContent = '\u25BC';
      legend.appendChild(collapseIndicator);
      const legendText = document.createTextNode(' ' + tech.name);
      legend.appendChild(legendText);
      fieldset.appendChild(legend);

      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('fieldset-content');

      for (const option of tech.options) {
        const optionEl = this._createOptionElement(techId, option, currentOptions[techId]);
        if (optionEl) {
          contentWrapper.appendChild(optionEl);
        }
      }

      fieldset.appendChild(contentWrapper);

      // Collapse all except first technology
      const techIndex = selectedIds.indexOf(techId);
      if (techIndex > 0) {
        fieldset.classList.add('collapsed');
      }

      legend.addEventListener('click', () => {
        fieldset.classList.toggle('collapsed');
      });

      container.appendChild(fieldset);
    }

    store.set('options', currentOptions);
    this._evaluateAllDependencies();
    this._loadAllFragments(selectedIds);
  }

  /**
   * Returns the default value for a given option definition.
   */
  _getDefaultValue(option) {
    if (option.type === 'single-select') {
      const defaultChoice = (option.choices || []).find(c => c.default);
      return defaultChoice ? defaultChoice.id : (option.choices && option.choices.length > 0 ? option.choices[0].id : '');
    }
    if (option.type === 'toggle') {
      return option.default === true;
    }
    if (option.type === 'freeform') {
      return option.default || '';
    }
    return '';
  }

  /**
   * Creates a DOM element for the given option by cloning the appropriate template.
   */
  _createOptionElement(techId, option, techOptions) {
    if (option.type === 'single-select') {
      return this._createSingleSelect(techId, option, techOptions);
    }
    if (option.type === 'toggle') {
      return this._createToggle(techId, option, techOptions);
    }
    if (option.type === 'freeform') {
      return this._createFreeform(techId, option, techOptions);
    }
    return null;
  }

  _createSingleSelect(techId, option, techOptions) {
    const tpl = this.shadowRoot.querySelector('[data-template-single-select]');
    if (!tpl) {
      return null;
    }

    const clone = tpl.content.cloneNode(true);
    const group = clone.querySelector('[data-option-group]');
    const label = clone.querySelector('[data-option-label]');
    const radioList = clone.querySelector('[data-radio-list]');

    if (label) {
      label.textContent = option.label;
    }

    if (group) {
      group.setAttribute('data-tech-id', techId);
      group.setAttribute('data-option-id', option.id);
      if (option.dependsOn) {
        group.setAttribute('data-depends-on', JSON.stringify(option.dependsOn));
      }
    }

    const currentValue = techOptions[option.id];
    const choiceTpl = this.shadowRoot.querySelector('[data-template-radio-choice]');

    for (const choice of (option.choices || [])) {
      if (!choiceTpl) {
        break;
      }

      const choiceClone = choiceTpl.content.cloneNode(true);
      const row = choiceClone.querySelector('.radio-row');
      const input = choiceClone.querySelector('.radio-input');
      const radioLabel = choiceClone.querySelector('[data-radio-label]');

      if (input) {
        input.type = 'radio';
        input.name = techId + '__' + option.id;
        input.value = choice.id;
        if (choice.id === currentValue) {
          input.checked = true;
        }
      }

      if (radioLabel) {
        radioLabel.textContent = choice.label;
      }

      if (row && choice.id === currentValue) {
        row.classList.add('selected');
      }

      if (row) {
        row.addEventListener('click', () => {
          this._handleRadioChange(techId, option.id, choice.id, row);
        });
      }

      if (radioList) {
        radioList.appendChild(choiceClone);
      }
    }

    return clone;
  }

  _createToggle(techId, option, techOptions) {
    const tpl = this.shadowRoot.querySelector('[data-template-toggle]');
    if (!tpl) {
      return null;
    }

    const clone = tpl.content.cloneNode(true);
    const group = clone.querySelector('[data-option-group]');
    const toggleLabel = clone.querySelector('[data-toggle-label]');
    const row = clone.querySelector('.toggle-row');
    const input = clone.querySelector('.checkbox-input');

    if (toggleLabel) {
      toggleLabel.textContent = option.label;
    }

    if (group) {
      group.setAttribute('data-tech-id', techId);
      group.setAttribute('data-option-id', option.id);
      if (option.dependsOn) {
        group.setAttribute('data-depends-on', JSON.stringify(option.dependsOn));
      }
    }

    const currentValue = techOptions[option.id];

    if (input) {
      input.checked = currentValue === true;
    }

    if (row && currentValue === true) {
      row.classList.add('checked');
    }

    if (row) {
      row.addEventListener('click', () => {
        const newValue = !input.checked;
        input.checked = newValue;
        if (newValue) {
          row.classList.add('checked');
        } else {
          row.classList.remove('checked');
        }
        this._handleOptionChange(techId, option.id, newValue);
      });
    }

    return clone;
  }

  _createFreeform(techId, option, techOptions) {
    const tpl = this.shadowRoot.querySelector('[data-template-freeform]');
    if (!tpl) {
      return null;
    }

    const clone = tpl.content.cloneNode(true);
    const group = clone.querySelector('[data-option-group]');
    const label = clone.querySelector('[data-option-label]');
    const input = clone.querySelector('[data-freeform-input]');

    if (label) {
      label.textContent = option.label;
    }

    if (group) {
      group.setAttribute('data-tech-id', techId);
      group.setAttribute('data-option-id', option.id);
      if (option.dependsOn) {
        group.setAttribute('data-depends-on', JSON.stringify(option.dependsOn));
      }
    }

    if (input) {
      input.value = techOptions[option.id] || '';
      if (option.placeholder) {
        input.placeholder = option.placeholder;
      }
      input.addEventListener('input', (event) => {
        this._handleOptionChange(techId, option.id, event.target.value);
      });
    }

    return clone;
  }

  /**
   * Handles a radio button selection change.
   */
  _handleRadioChange(techId, optionId, choiceId, selectedRow) {
    // Update visual state — clear siblings, mark selected
    const radioList = selectedRow.parentElement;
    if (radioList) {
      const rows = radioList.querySelectorAll('.radio-row');
      rows.forEach(row => {
        row.classList.remove('selected');
        const input = row.querySelector('.radio-input');
        if (input) {
          input.checked = false;
        }
      });
    }

    selectedRow.classList.add('selected');
    const input = selectedRow.querySelector('.radio-input');
    if (input) {
      input.checked = true;
    }

    this._handleOptionChange(techId, optionId, choiceId);
  }

  /**
   * Common handler for any option value change.
   * Updates the store and re-evaluates dependencies.
   */
  _handleOptionChange(techId, optionId, value) {
    const options = store.get('options') || {};
    if (!options[techId]) {
      options[techId] = {};
    }
    options[techId][optionId] = value;
    store.set('options', options);

    eventBus.emit(OPTIONS_CHANGED, { techId, optionId, value });
    this._evaluateAllDependencies();

    const selectedIds = store.get('selectedTechIds') || [];
    this._loadAllFragments(selectedIds);
  }

  /**
   * Shows or hides option groups that have dependsOn constraints.
   */
  _evaluateAllDependencies() {
    const options = store.get('options') || {};
    const groups = this.shadowRoot.querySelectorAll('[data-depends-on]');

    groups.forEach(group => {
      const techId = group.getAttribute('data-tech-id');
      const dependsOnRaw = group.getAttribute('data-depends-on');

      if (!dependsOnRaw || !techId) {
        return;
      }

      let dependsOn;
      try {
        dependsOn = JSON.parse(dependsOnRaw);
      } catch (e) {
        return;
      }

      const techOptions = options[techId] || {};
      let satisfied = true;

      for (const depKey of Object.keys(dependsOn)) {
        const allowedValues = dependsOn[depKey];
        const currentValue = techOptions[depKey];

        if (Array.isArray(allowedValues)) {
          if (!allowedValues.includes(currentValue)) {
            satisfied = false;
            break;
          }
        } else {
          if (currentValue !== allowedValues) {
            satisfied = false;
            break;
          }
        }
      }

      if (satisfied) {
        group.removeAttribute('hidden');
      } else {
        group.setAttribute('hidden', '');
      }
    });
  }

  /**
   * Loads fragments and templates for all selected technologies.
   */
  async _loadAllFragments(selectedIds) {
    try {
      const fragmentPromises = selectedIds.map(id => loadFragments(id));
      const fragmentResults = await Promise.all(fragmentPromises);
      const allFragments = fragmentResults.flat();

      const comboFragments = await loadCombinationFragments(selectedIds);
      allFragments.push(...comboFragments);

      store.set('fragments', allFragments);

      const templatePromises = selectedIds.map(id => loadTemplates(id));
      const templateResults = await Promise.all(templatePromises);
      store.set('templateFiles', templateResults.flat());
    } catch (err) {
      eventBus.emit(TOAST_SHOW, {
        message: 'Failed to load some prompt fragments.',
        type: 'error'
      });
    }
  }
}

customElements.define('option-panel', OptionPanel);
