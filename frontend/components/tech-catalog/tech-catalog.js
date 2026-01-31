/**
 * TechCatalog — Grid of technology cards with search and category filtering.
 * Loads the technology manifest, renders tech-card elements, handles
 * selection state, incompatibility checks, and navigation to the next step.
 */
import { store } from '../../js/store.js';
import { eventBus, TECH_SELECTED, TECH_DESELECTED, NAVIGATE, TOAST_SHOW } from '../../js/event-bus.js';
import { loadManifest } from '../../js/prompt-loader.js';

export class TechCatalog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._manifest = null;
    this._activeCategory = 'all';
    this._searchQuery = '';
    this._unsubscribers = [];
    this._gridCollapsed = false;
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./tech-catalog.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./tech-catalog.css', import.meta.url)).then(r => r.text())
    ]);

    const style = document.createElement('style');
    style.textContent = css;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.shadowRoot.append(style, template.content.cloneNode(true));

    this._bind();
    await this._loadTechnologies();
  }

  disconnectedCallback() {
    for (const unsub of this._unsubscribers) {
      unsub();
    }
    this._unsubscribers = [];
  }

  _bind() {
    const searchInput = this.shadowRoot.querySelector('[data-search-input]');
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        this._searchQuery = event.target.value.toLowerCase().trim();
        this._applyFilters();
      });
    }

    const filterContainer = this.shadowRoot.querySelector('[data-category-filters]');
    if (filterContainer) {
      filterContainer.addEventListener('click', (event) => {
        const btn = event.target.closest('.filter-btn');
        if (!btn) {
          return;
        }
        this._setActiveCategory(btn.getAttribute('data-category'));
      });
    }

    this.shadowRoot.addEventListener('tech-card-toggle', (event) => {
      this._handleCardToggle(event.detail);
    });

    const toggleBtn = this.shadowRoot.querySelector('[data-toggle-grid]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this._toggleGridCollapse();
      });
    }

    const chipsContainer = this.shadowRoot.querySelector('[data-selected-chips]');
    if (chipsContainer) {
      chipsContainer.addEventListener('click', (event) => {
        const removeBtn = event.target.closest('.chip-remove');
        if (!removeBtn) {
          return;
        }
        const techId = removeBtn.getAttribute('data-tech-id');
        if (techId) {
          this._deselectTech(techId);
        }
      });
    }

    const unsub = store.subscribe('selectedTechIds', () => {
      this._updateSelectionUI();
    });
    this._unsubscribers.push(unsub);
  }

  async _loadTechnologies() {
    try {
      this._manifest = await loadManifest();
    } catch (err) {
      eventBus.emit(TOAST_SHOW, {
        message: 'Failed to load technologies. Please try again.',
        type: 'error'
      });
      return;
    }

    this._renderCards();
    this._updateSelectionUI();
  }

  _renderCards() {
    const grid = this.shadowRoot.querySelector('[data-catalog-grid]');
    if (!grid) {
      return;
    }

    while (grid.firstChild) {
      grid.removeChild(grid.firstChild);
    }

    const technologies = store.get('technologies') || [];
    const selectedIds = store.get('selectedTechIds') || [];

    for (const tech of technologies) {
      const card = document.createElement('tech-card');
      card.setData({
        id: tech.id,
        name: tech.name,
        description: tech.description,
        categories: tech.categories
      });

      if (selectedIds.includes(tech.id)) {
        card.setAttribute('selected', '');
      }

      grid.appendChild(card);
    }

    this._applyFilters();
  }

  _applyFilters() {
    const grid = this.shadowRoot.querySelector('[data-catalog-grid]');
    const emptyState = this.shadowRoot.querySelector('[data-empty-state]');
    if (!grid) {
      return;
    }

    const cards = grid.querySelectorAll('tech-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const name = (card.getAttribute('name') || '').toLowerCase();
      const description = (card.getAttribute('description') || '').toLowerCase();
      const categories = (card.getAttribute('categories') || '').toLowerCase();

      const matchesSearch = !this._searchQuery
        || name.includes(this._searchQuery)
        || description.includes(this._searchQuery)
        || categories.includes(this._searchQuery);

      const matchesCategory = this._activeCategory === 'all'
        || categories.split(',').map(c => c.trim()).includes(this._activeCategory);

      if (matchesSearch && matchesCategory) {
        card.removeAttribute('hidden');
        visibleCount++;
      } else {
        card.setAttribute('hidden', '');
      }
    });

    if (emptyState) {
      if (visibleCount === 0 && cards.length > 0) {
        emptyState.removeAttribute('hidden');
      } else {
        emptyState.setAttribute('hidden', '');
      }
    }
  }

  _setActiveCategory(category) {
    this._activeCategory = category || 'all';

    const buttons = this.shadowRoot.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-category') === this._activeCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this._applyFilters();
  }

  _handleCardToggle(detail) {
    const { techId, selected } = detail;
    const currentSelected = [...(store.get('selectedTechIds') || [])];

    if (selected) {
      if (!currentSelected.includes(techId)) {
        const incompatible = this._checkIncompatibilities(techId, currentSelected);
        if (incompatible) {
          eventBus.emit(TOAST_SHOW, {
            message: incompatible,
            type: 'warning'
          });

          const card = this.shadowRoot.querySelector(
            'tech-card[tech-id="' + techId + '"]'
          );
          if (card) {
            card.removeAttribute('selected');
          }
          return;
        }

        currentSelected.push(techId);
        eventBus.emit(TECH_SELECTED, { techId });
      }
    } else {
      const index = currentSelected.indexOf(techId);
      if (index !== -1) {
        currentSelected.splice(index, 1);
        eventBus.emit(TECH_DESELECTED, { techId });
      }
    }

    store.set('selectedTechIds', currentSelected);
    this._updateIncompatibleStates(currentSelected);
  }

  _checkIncompatibilities(techId, currentSelected) {
    if (!this._manifest) {
      return null;
    }

    const technologies = this._manifest.technologies || [];
    const targetTech = technologies.find(t => t.id === techId);

    if (!targetTech || !targetTech.incompatibleWith) {
      return null;
    }

    for (const incompatId of targetTech.incompatibleWith) {
      if (currentSelected.includes(incompatId)) {
        const incompatTech = technologies.find(t => t.id === incompatId);
        const incompatName = incompatTech ? incompatTech.name : incompatId;
        return targetTech.name + ' is incompatible with ' + incompatName + '.';
      }
    }

    return null;
  }

  _updateIncompatibleStates(selectedIds) {
    if (!this._manifest) {
      return;
    }

    const technologies = this._manifest.technologies || [];
    const incompatibleIds = new Set();

    for (const selId of selectedIds) {
      const tech = technologies.find(t => t.id === selId);
      if (tech && tech.incompatibleWith) {
        for (const incompId of tech.incompatibleWith) {
          if (!selectedIds.includes(incompId)) {
            incompatibleIds.add(incompId);
          }
        }
      }
    }

    const grid = this.shadowRoot.querySelector('[data-catalog-grid]');
    if (!grid) {
      return;
    }

    const cards = grid.querySelectorAll('tech-card');
    cards.forEach(card => {
      const cardTechId = card.getAttribute('tech-id');
      if (incompatibleIds.has(cardTechId)) {
        card.setAttribute('disabled', '');
      } else {
        card.removeAttribute('disabled');
      }
    });
  }

  _updateSelectionUI() {
    const selectedIds = store.get('selectedTechIds') || [];
    const count = selectedIds.length;

    const countEl = this.shadowRoot.querySelector('[data-selection-count]');
    if (countEl) {
      if (count === 0) {
        countEl.textContent = 'No technologies selected';
      } else if (count === 1) {
        countEl.textContent = '1 technology selected';
      } else {
        countEl.textContent = count + ' technologies selected';
      }
    }

    const grid = this.shadowRoot.querySelector('[data-catalog-grid]');
    if (grid) {
      const cards = grid.querySelectorAll('tech-card');
      cards.forEach(card => {
        const cardTechId = card.getAttribute('tech-id');
        if (selectedIds.includes(cardTechId)) {
          if (!card.hasAttribute('selected')) {
            card.setAttribute('selected', '');
          }
        } else {
          if (card.hasAttribute('selected')) {
            card.removeAttribute('selected');
          }
        }
      });
    }

    this._updateIncompatibleStates(selectedIds);
    this._renderChips(selectedIds);
    this._updateCollapseState(selectedIds);
  }

  _renderChips(selectedIds) {
    const chipsContainer = this.shadowRoot.querySelector('[data-selected-chips]');
    if (!chipsContainer) {
      return;
    }

    while (chipsContainer.firstChild) {
      chipsContainer.removeChild(chipsContainer.firstChild);
    }

    if (selectedIds.length === 0) {
      chipsContainer.setAttribute('hidden', '');
      return;
    }

    chipsContainer.removeAttribute('hidden');

    const technologies = store.get('technologies') || [];
    for (const techId of selectedIds) {
      const tech = technologies.find(function(t) { return t.id === techId; });
      const chipName = tech ? tech.name : techId;

      const chip = document.createElement('span');
      chip.className = 'chip';

      const label = document.createElement('span');
      label.textContent = chipName;
      chip.appendChild(label);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'chip-remove';
      removeBtn.setAttribute('data-tech-id', techId);
      removeBtn.setAttribute('type', 'button');
      removeBtn.setAttribute('aria-label', 'Remove ' + chipName);
      removeBtn.textContent = '\u00D7';
      chip.appendChild(removeBtn);

      chipsContainer.appendChild(chip);
    }
  }

  _updateCollapseState(selectedIds) {
    const toggleBtn = this.shadowRoot.querySelector('[data-toggle-grid]');
    const catalogBody = this.shadowRoot.querySelector('[data-catalog-body]');
    const catalogFooter = this.shadowRoot.querySelector('[data-catalog-footer]');

    if (!toggleBtn || !catalogBody) {
      return;
    }

    if (selectedIds.length > 0) {
      toggleBtn.removeAttribute('hidden');
      // Auto-collapse grid when selections exist
      if (!this._gridCollapsed) {
        this._gridCollapsed = true;
        catalogBody.classList.add('collapsed');
        if (catalogFooter) {
          catalogFooter.setAttribute('hidden', '');
        }
        toggleBtn.textContent = 'Edit Stack';
      }
    } else {
      toggleBtn.setAttribute('hidden', '');
      this._gridCollapsed = false;
      catalogBody.classList.remove('collapsed');
      if (catalogFooter) {
        catalogFooter.removeAttribute('hidden');
      }
    }
  }

  _toggleGridCollapse() {
    const catalogBody = this.shadowRoot.querySelector('[data-catalog-body]');
    const toggleBtn = this.shadowRoot.querySelector('[data-toggle-grid]');
    const catalogFooter = this.shadowRoot.querySelector('[data-catalog-footer]');

    if (!catalogBody || !toggleBtn) {
      return;
    }

    this._gridCollapsed = !this._gridCollapsed;

    if (this._gridCollapsed) {
      catalogBody.classList.add('collapsed');
      if (catalogFooter) {
        catalogFooter.setAttribute('hidden', '');
      }
      toggleBtn.textContent = 'Edit Stack';
    } else {
      catalogBody.classList.remove('collapsed');
      if (catalogFooter) {
        catalogFooter.removeAttribute('hidden');
      }
      toggleBtn.textContent = 'Collapse';
    }
  }

  _deselectTech(techId) {
    const currentSelected = [...(store.get('selectedTechIds') || [])];
    const index = currentSelected.indexOf(techId);
    if (index !== -1) {
      currentSelected.splice(index, 1);
      eventBus.emit(TECH_DESELECTED, { techId: techId });
      store.set('selectedTechIds', currentSelected);
    }
  }
}

customElements.define('tech-catalog', TechCatalog);
