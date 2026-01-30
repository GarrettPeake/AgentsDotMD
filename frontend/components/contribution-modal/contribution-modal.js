/**
 * ContributionModal — Modal for suggesting changes to prompt fragments.
 * Displays a diff view, collects rationale, and submits contributions
 * via authenticated or anonymous paths.
 */
import { store } from '../../js/store.js';
import { eventBus, CONTRIBUTION_SUBMIT, TOAST_SHOW } from '../../js/event-bus.js';
import { isAuthenticated, getToken, startAuth, fetchWithAuth } from '../../js/github-auth.js';
import { computeDiff, formatUnifiedDiff } from '../../js/diff.js';

export class ContributionModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._unsubscribers = [];
    this._fragmentData = null;
    this._ready = false;
  }

  async connectedCallback() {
    var self = this;

    var results = await Promise.all([
      fetch(new URL('./contribution-modal.html', import.meta.url)).then(function(r) { return r.text(); }),
      fetch(new URL('./contribution-modal.css', import.meta.url)).then(function(r) { return r.text(); })
    ]);

    var html = results[0];
    var css = results[1];

    var style = document.createElement('style');
    style.textContent = css;

    var template = document.createElement('template');
    template.innerHTML = html;

    self.shadowRoot.append(style, template.content.cloneNode(true));

    self._ready = true;
    self._bind();
  }

  disconnectedCallback() {
    for (var i = 0; i < this._unsubscribers.length; i++) {
      this._unsubscribers[i]();
    }
    this._unsubscribers = [];
  }

  _bind() {
    var self = this;

    // Close button
    var closeBtn = self.shadowRoot.querySelector('[data-close-btn]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        self.hide();
      });
    }

    // Overlay click to close
    var overlay = self.shadowRoot.querySelector('[data-overlay]');
    if (overlay) {
      overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
          self.hide();
        }
      });
    }

    // Submit with GitHub account
    var submitAuthBtn = self.shadowRoot.querySelector('[data-submit-auth-btn]');
    if (submitAuthBtn) {
      submitAuthBtn.addEventListener('click', function() {
        self._submitAuthenticated();
      });
    }

    // Submit anonymously
    var submitAnonBtn = self.shadowRoot.querySelector('[data-submit-anon-btn]');
    if (submitAnonBtn) {
      submitAnonBtn.addEventListener('click', function() {
        self._submitAnonymous();
      });
    }

    // Listen for CONTRIBUTION_SUBMIT event to open the modal
    var onContributionSubmit = function(data) {
      self.show(data);
    };
    var unsub = eventBus.on(CONTRIBUTION_SUBMIT, onContributionSubmit);
    self._unsubscribers.push(unsub);
  }

  /**
   * Opens the modal with the given fragment data.
   * @param {Object} fragmentData
   * @param {string} fragmentData.fragmentId - Fragment identifier.
   * @param {string} fragmentData.technology - Technology name.
   * @param {string} fragmentData.originalContent - Original fragment content.
   * @param {string} fragmentData.editedContent - User's edited content.
   * @param {string} [fragmentData.mode] - 'edit' or 'new-fragment'.
   * @param {string} [fragmentData.category] - Category for new fragments.
   */
  show(fragmentData) {
    var self = this;
    self._fragmentData = fragmentData;

    var overlay = self.shadowRoot.querySelector('[data-overlay]');
    if (overlay) {
      overlay.removeAttribute('hidden');
    }

    // Reset status
    self._hideStatus();

    // Reset rationale
    var rationaleEl = self.shadowRoot.querySelector('[data-rationale]');
    if (rationaleEl) {
      rationaleEl.value = '';
    }

    var mode = fragmentData.mode || 'edit';

    if (mode === 'new-fragment') {
      self._showNewFragmentMode(fragmentData);
    } else {
      self._showEditMode(fragmentData);
    }
  }

  /**
   * Hides the modal.
   */
  hide() {
    var self = this;
    var overlay = self.shadowRoot.querySelector('[data-overlay]');
    if (overlay) {
      overlay.setAttribute('hidden', '');
    }
    self._fragmentData = null;
  }

  /**
   * Shows the modal in edit mode with diff display.
   * @param {Object} fragmentData
   */
  _showEditMode(fragmentData) {
    var self = this;

    // Show fragment info
    var fragmentInfoEl = self.shadowRoot.querySelector('[data-fragment-info]');
    if (fragmentInfoEl) {
      fragmentInfoEl.style.display = '';
    }

    var idEl = self.shadowRoot.querySelector('[data-fragment-id]');
    if (idEl) {
      idEl.textContent = fragmentData.fragmentId || '';
    }

    var techEl = self.shadowRoot.querySelector('[data-fragment-technology]');
    if (techEl) {
      techEl.textContent = fragmentData.technology || '';
    }

    // Show diff section
    var diffSection = self.shadowRoot.querySelector('[data-diff-section]');
    if (diffSection) {
      diffSection.style.display = '';
    }

    // Hide new fragment section
    var newFragSection = self.shadowRoot.querySelector('[data-new-fragment-section]');
    if (newFragSection) {
      newFragSection.setAttribute('hidden', '');
    }

    // Render diff
    self._renderDiff(fragmentData.originalContent || '', fragmentData.editedContent || '');
  }

  /**
   * Shows the modal in new-fragment mode with input fields.
   * @param {Object} fragmentData
   */
  _showNewFragmentMode(fragmentData) {
    var self = this;

    // Hide fragment info (no existing fragment)
    var fragmentInfoEl = self.shadowRoot.querySelector('[data-fragment-info]');
    if (fragmentInfoEl) {
      fragmentInfoEl.style.display = 'none';
    }

    // Hide diff section
    var diffSection = self.shadowRoot.querySelector('[data-diff-section]');
    if (diffSection) {
      diffSection.style.display = 'none';
    }

    // Show new fragment section
    var newFragSection = self.shadowRoot.querySelector('[data-new-fragment-section]');
    if (newFragSection) {
      newFragSection.removeAttribute('hidden');
    }

    // Pre-fill fields if provided
    var techInput = self.shadowRoot.querySelector('[data-new-technology]');
    if (techInput) {
      techInput.value = fragmentData.technology || '';
    }

    var categoryInput = self.shadowRoot.querySelector('[data-new-category]');
    if (categoryInput) {
      categoryInput.value = fragmentData.category || '';
    }

    var contentInput = self.shadowRoot.querySelector('[data-new-content]');
    if (contentInput) {
      contentInput.value = fragmentData.editedContent || '';
    }
  }

  /**
   * Renders the diff into the diff view container using DOM elements only.
   * @param {string} original
   * @param {string} modified
   */
  _renderDiff(original, modified) {
    var self = this;
    var diffView = self.shadowRoot.querySelector('[data-diff-view]');

    if (!diffView) {
      return;
    }

    // Clear existing content
    while (diffView.firstChild) {
      diffView.removeChild(diffView.firstChild);
    }

    var diffEntries = computeDiff(original, modified);

    if (diffEntries.length === 0) {
      var emptyLine = document.createElement('div');
      emptyLine.className = 'diff-line diff-line-context';
      emptyLine.textContent = '(no changes)';
      diffView.appendChild(emptyLine);
      return;
    }

    // Add header lines
    var headerOriginal = document.createElement('div');
    headerOriginal.className = 'diff-line diff-line-header';
    headerOriginal.textContent = '--- original';
    diffView.appendChild(headerOriginal);

    var headerModified = document.createElement('div');
    headerModified.className = 'diff-line diff-line-header';
    headerModified.textContent = '+++ modified';
    diffView.appendChild(headerModified);

    // Render each diff entry as a DOM element
    for (var i = 0; i < diffEntries.length; i++) {
      var entry = diffEntries[i];
      var lineEl = document.createElement('div');

      if (entry.type === 'added') {
        lineEl.className = 'diff-line diff-line-added';
        lineEl.textContent = '+ ' + entry.line;
      } else if (entry.type === 'removed') {
        lineEl.className = 'diff-line diff-line-removed';
        lineEl.textContent = '- ' + entry.line;
      } else {
        lineEl.className = 'diff-line diff-line-context';
        lineEl.textContent = '  ' + entry.line;
      }

      diffView.appendChild(lineEl);
    }
  }

  /**
   * Validates that the rationale field is filled.
   * @returns {boolean}
   */
  _validateRationale() {
    var self = this;
    var rationaleEl = self.shadowRoot.querySelector('[data-rationale]');
    var rationale = rationaleEl ? rationaleEl.value.trim() : '';

    if (!rationale) {
      eventBus.emit(TOAST_SHOW, { message: 'Please provide a rationale for your change.', type: 'error' });
      if (rationaleEl) {
        rationaleEl.focus();
      }
      return false;
    }

    return true;
  }

  /**
   * Builds the submission payload from current modal state.
   * @returns {Object}
   */
  _buildPayload() {
    var self = this;
    var data = self._fragmentData || {};
    var mode = data.mode || 'edit';
    var rationaleEl = self.shadowRoot.querySelector('[data-rationale]');
    var rationale = rationaleEl ? rationaleEl.value.trim() : '';

    var payload = {
      type: mode === 'new-fragment' ? 'new-fragment' : 'edit',
      rationale: rationale
    };

    if (mode === 'new-fragment') {
      var techInput = self.shadowRoot.querySelector('[data-new-technology]');
      var categoryInput = self.shadowRoot.querySelector('[data-new-category]');
      var contentInput = self.shadowRoot.querySelector('[data-new-content]');

      payload.technology = techInput ? techInput.value.trim() : '';
      payload.category = categoryInput ? categoryInput.value.trim() : '';
      payload.editedContent = contentInput ? contentInput.value : '';
    } else {
      payload.fragmentId = data.fragmentId || '';
      payload.technology = data.technology || '';
      payload.originalContent = data.originalContent || '';
      payload.editedContent = data.editedContent || '';
    }

    return payload;
  }

  /**
   * Submits the contribution using the user's GitHub OAuth token.
   */
  async _submitAuthenticated() {
    var self = this;

    if (!self._validateRationale()) {
      return;
    }

    // If not authenticated, start auth first
    if (!isAuthenticated()) {
      startAuth();
      eventBus.emit(TOAST_SHOW, { message: 'Please sign in with GitHub first.', type: 'info' });
      return;
    }

    var payload = self._buildPayload();
    payload.token = getToken();

    self._showStatusMessage('Submitting contribution...');
    self._setSubmitLoading(true);

    try {
      var response = await fetchWithAuth('/api/contribute/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        var errData = await response.json().catch(function() { return {}; });
        throw new Error(errData.message || 'Submission failed');
      }

      var result = await response.json();
      self._showStatusMessage('Contribution submitted successfully!');
      self._showStatusLink(result.html_url || result.url || '', 'View Pull Request');
      eventBus.emit(TOAST_SHOW, { message: 'Contribution submitted!', type: 'success' });

    } catch (err) {
      self._showStatusMessage('Error: ' + (err.message || 'Submission failed'));
      eventBus.emit(TOAST_SHOW, { message: err.message || 'Submission failed.', type: 'error' });
    } finally {
      self._setSubmitLoading(false);
    }
  }

  /**
   * Submits the contribution anonymously via the bot token on the backend.
   */
  async _submitAnonymous() {
    var self = this;

    if (!self._validateRationale()) {
      return;
    }

    var payload = self._buildPayload();

    self._showStatusMessage('Submitting anonymously...');
    self._setSubmitLoading(true);

    try {
      var response = await fetch('/api/contribute/anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        var errData = await response.json().catch(function() { return {}; });
        throw new Error(errData.message || 'Anonymous submission failed');
      }

      var result = await response.json();
      self._showStatusMessage('Anonymous contribution submitted!');
      self._showStatusLink(result.html_url || result.url || '', 'View Pull Request');
      eventBus.emit(TOAST_SHOW, { message: 'Anonymous contribution submitted!', type: 'success' });

    } catch (err) {
      self._showStatusMessage('Error: ' + (err.message || 'Anonymous submission failed'));
      eventBus.emit(TOAST_SHOW, { message: err.message || 'Submission failed.', type: 'error' });
    } finally {
      self._setSubmitLoading(false);
    }
  }

  /**
   * Displays a status message in the status section.
   * @param {string} message
   */
  _showStatusMessage(message) {
    var self = this;
    var section = self.shadowRoot.querySelector('[data-status-section]');
    var messageEl = self.shadowRoot.querySelector('[data-status-message]');
    var linkEl = self.shadowRoot.querySelector('[data-status-link]');

    if (section) { section.removeAttribute('hidden'); }
    if (messageEl) { messageEl.textContent = message; }
    if (linkEl) { linkEl.setAttribute('hidden', ''); }
  }

  /**
   * Displays a clickable link in the status section.
   * @param {string} url
   * @param {string} text
   */
  _showStatusLink(url, text) {
    var self = this;
    var linkEl = self.shadowRoot.querySelector('[data-status-link]');

    if (linkEl && url) {
      linkEl.href = url;
      linkEl.textContent = text || url;
      linkEl.removeAttribute('hidden');
    }
  }

  /**
   * Hides the status section.
   */
  _hideStatus() {
    var self = this;
    var section = self.shadowRoot.querySelector('[data-status-section]');
    if (section) {
      section.setAttribute('hidden', '');
    }
  }

  /**
   * Sets the loading state on submit buttons.
   * @param {boolean} loading
   */
  _setSubmitLoading(loading) {
    var self = this;
    var authBtn = self.shadowRoot.querySelector('[data-submit-auth-btn]');
    var anonBtn = self.shadowRoot.querySelector('[data-submit-anon-btn]');

    if (loading) {
      if (authBtn) { authBtn.setAttribute('disabled', ''); }
      if (anonBtn) { anonBtn.setAttribute('disabled', ''); }
    } else {
      if (authBtn) { authBtn.removeAttribute('disabled'); }
      if (anonBtn) { anonBtn.removeAttribute('disabled'); }
    }
  }
}

customElements.define('contribution-modal', ContributionModal);
