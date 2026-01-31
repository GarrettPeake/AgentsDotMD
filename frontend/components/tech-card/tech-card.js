/**
 * TechCard — Single technology selection card.
 * Displays a technology's icon, name, description, and category badges.
 * Toggles selection on click and dispatches a 'tech-card-toggle' custom event.
 */
export class TechCard extends HTMLElement {
  static get observedAttributes() {
    return ['tech-id', 'name', 'description', 'categories', 'selected'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._handleClick = this._handleClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./tech-card.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./tech-card.css', import.meta.url)).then(r => r.text())
    ]);

    const style = document.createElement('style');
    style.textContent = css;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.shadowRoot.append(style, template.content.cloneNode(true));

    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    this.setAttribute('role', 'option');

    this._bind();
    this._render();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick);
    this.removeEventListener('keydown', this._handleKeyDown);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    if (this.shadowRoot && this.shadowRoot.querySelector('.card')) {
      this._render();
    }
  }

  /**
   * Sets all card data from an object.
   * @param {{ id: string, name: string, description: string, categories: string[] }} data
   */
  setData(data) {
    if (data.id) {
      this.setAttribute('tech-id', data.id);
    }
    if (data.name) {
      this.setAttribute('name', data.name);
    }
    if (data.description) {
      this.setAttribute('description', data.description);
    }
    if (data.categories) {
      const cats = Array.isArray(data.categories) ? data.categories.join(',') : data.categories;
      this.setAttribute('categories', cats);
    }
  }

  get isSelected() {
    return this.hasAttribute('selected');
  }

  _bind() {
    this.addEventListener('click', this._handleClick);
    this.addEventListener('keydown', this._handleKeyDown);
  }

  _handleClick() {
    if (this.hasAttribute('disabled')) {
      return;
    }
    this._toggleSelection();
  }

  _handleKeyDown(event) {
    if (this.hasAttribute('disabled')) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this._toggleSelection();
    }
  }

  _toggleSelection() {
    if (this.isSelected) {
      this.removeAttribute('selected');
    } else {
      this.setAttribute('selected', '');
    }

    this.setAttribute('aria-selected', String(this.isSelected));

    this.dispatchEvent(new CustomEvent('tech-card-toggle', {
      bubbles: true,
      composed: true,
      detail: {
        techId: this.getAttribute('tech-id'),
        selected: this.isSelected
      }
    }));
  }

  _render() {
    const nameEl = this.shadowRoot.querySelector('[data-card-name]');
    const descriptionEl = this.shadowRoot.querySelector('[data-card-description]');
    const iconEl = this.shadowRoot.querySelector('[data-card-icon]');

    if (!nameEl) {
      return;
    }

    const name = this.getAttribute('name') || '';
    const description = this.getAttribute('description') || '';
    const techId = this.getAttribute('tech-id') || '';

    nameEl.textContent = name;
    descriptionEl.textContent = description;
    iconEl.textContent = name.charAt(0).toUpperCase();

    // Assign a distinct background color to the icon based on tech ID
    var iconColor = this._getIconColor(techId);
    iconEl.style.backgroundColor = iconColor;
    iconEl.style.color = '#FFFFFF';
    iconEl.style.borderColor = iconColor;

    this.setAttribute('aria-selected', String(this.isSelected));
  }

  /**
   * Returns a deterministic color for the tech icon based on the tech ID.
   * Uses a palette of distinct, accessible colors.
   */
  _getIconColor(techId) {
    var palette = [
      '#D94F04', // orange
      '#2B6CB0', // blue
      '#2F855A', // green
      '#9B2C2C', // red
      '#6B46C1', // purple
      '#B7791F', // gold
      '#2C7A7B', // teal
      '#744210', // brown
      '#4A5568', // slate
      '#C53030', // crimson
      '#38A169', // emerald
      '#805AD5', // violet
    ];
    // djb2 hash for good distribution across palette
    var hash = 5381;
    for (var i = 0; i < techId.length; i++) {
      hash = ((hash << 5) + hash + techId.charCodeAt(i)) | 0;
    }
    var index = ((hash % palette.length) + palette.length) % palette.length;
    return palette[index];
  }

}

customElements.define('tech-card', TechCard);
