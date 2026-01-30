/**
 * GithubCommit — GitHub PR creation form.
 * Handles OAuth authentication, repository selection, and pull request
 * creation for committing generated files to a GitHub repository.
 */
import { store } from '../../js/store.js';
import { eventBus, AUTH_SUCCESS, AUTH_LOGOUT, TOAST_SHOW, NAVIGATE } from '../../js/event-bus.js';
import { startAuth, isAuthenticated, getToken, fetchWithAuth, logout } from '../../js/github-auth.js';

export class GithubCommit extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._unsubscribers = [];
    this._repos = [];
    this._selectedRepo = null;
    this._isNewRepoMode = false;
  }

  async connectedCallback() {
    var self = this;

    var results = await Promise.all([
      fetch(new URL('./github-commit.html', import.meta.url)).then(function(r) { return r.text(); }),
      fetch(new URL('./github-commit.css', import.meta.url)).then(function(r) { return r.text(); })
    ]);

    var html = results[0];
    var css = results[1];

    var style = document.createElement('style');
    style.textContent = css;

    var template = document.createElement('template');
    template.innerHTML = html;

    self.shadowRoot.append(style, template.content.cloneNode(true));

    self._bind();
    self._syncAuthState();
  }

  disconnectedCallback() {
    for (var i = 0; i < this._unsubscribers.length; i++) {
      this._unsubscribers[i]();
    }
    this._unsubscribers = [];
  }

  _bind() {
    var self = this;

    // Auth button
    var authBtn = self.shadowRoot.querySelector('[data-auth-btn]');
    if (authBtn) {
      authBtn.addEventListener('click', function() {
        startAuth();
      });
    }

    // Logout button
    var logoutBtn = self.shadowRoot.querySelector('[data-auth-logout-btn]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        logout();
      });
    }

    // Repo search input
    var searchInput = self.shadowRoot.querySelector('[data-repo-search]');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        self._filterRepos(searchInput.value);
      });
    }

    // New repo toggle
    var newRepoToggleBtn = self.shadowRoot.querySelector('[data-new-repo-toggle-btn]');
    if (newRepoToggleBtn) {
      newRepoToggleBtn.addEventListener('click', function() {
        self._toggleNewRepoMode();
      });
    }

    // Create PR button
    var createPrBtn = self.shadowRoot.querySelector('[data-create-pr-btn]');
    if (createPrBtn) {
      createPrBtn.addEventListener('click', function() {
        self._createPullRequest();
      });
    }

    // Create repo button
    var createRepoBtn = self.shadowRoot.querySelector('[data-create-repo-btn]');
    if (createRepoBtn) {
      createRepoBtn.addEventListener('click', function() {
        self._createNewRepo();
      });
    }

    // Back button
    var backBtn = self.shadowRoot.querySelector('[data-back-btn]');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        eventBus.emit(NAVIGATE, '#/export');
      });
    }

    // Listen for auth events
    var onAuthSuccess = function() {
      self._syncAuthState();
    };
    var unsubAuth = eventBus.on(AUTH_SUCCESS, onAuthSuccess);
    self._unsubscribers.push(unsubAuth);

    var onAuthLogout = function() {
      self._syncAuthState();
    };
    var unsubLogout = eventBus.on(AUTH_LOGOUT, onAuthLogout);
    self._unsubscribers.push(unsubLogout);
  }

  /**
   * Syncs the UI based on current authentication state.
   */
  _syncAuthState() {
    var self = this;
    var authenticated = isAuthenticated();
    var unauthEl = self.shadowRoot.querySelector('[data-auth-unauthenticated]');
    var authEl = self.shadowRoot.querySelector('[data-auth-authenticated]');
    var repoSection = self.shadowRoot.querySelector('[data-repo-section]');
    var prSection = self.shadowRoot.querySelector('[data-pr-section]');

    if (authenticated) {
      if (unauthEl) { unauthEl.setAttribute('hidden', ''); }
      if (authEl) { authEl.removeAttribute('hidden'); }
      if (repoSection) { repoSection.removeAttribute('hidden'); }

      self._fetchUserInfo();
      self._fetchRepos();
      self._populateDefaults();
    } else {
      if (unauthEl) { unauthEl.removeAttribute('hidden'); }
      if (authEl) { authEl.setAttribute('hidden', ''); }
      if (repoSection) { repoSection.setAttribute('hidden', ''); }
      if (prSection) { prSection.setAttribute('hidden', ''); }

      self._hideActionButtons();
    }
  }

  /**
   * Fetches the authenticated user's info from GitHub.
   */
  async _fetchUserInfo() {
    var self = this;

    try {
      var response = await fetchWithAuth('https://api.github.com/user');
      if (!response.ok) {
        return;
      }
      var user = await response.json();
      var nameEl = self.shadowRoot.querySelector('[data-auth-user-name]');
      if (nameEl) {
        nameEl.textContent = user.login || '';
      }
    } catch (err) {
      // Silently fail — user info is non-critical
    }
  }

  /**
   * Fetches the user's repositories from the backend proxy.
   */
  async _fetchRepos() {
    var self = this;
    var loadingEl = self.shadowRoot.querySelector('[data-repo-loading]');
    var emptyEl = self.shadowRoot.querySelector('[data-repo-empty]');
    var listEl = self.shadowRoot.querySelector('[data-repo-list]');

    if (loadingEl) { loadingEl.removeAttribute('hidden'); }
    if (emptyEl) { emptyEl.setAttribute('hidden', ''); }
    if (listEl) {
      while (listEl.firstChild) {
        listEl.removeChild(listEl.firstChild);
      }
    }

    try {
      var response = await fetchWithAuth('/api/github/repos');

      if (!response.ok) {
        throw new Error('Failed to load repositories');
      }

      var repos = await response.json();
      self._repos = repos;

      if (loadingEl) { loadingEl.setAttribute('hidden', ''); }

      if (repos.length === 0) {
        if (emptyEl) { emptyEl.removeAttribute('hidden'); }
        return;
      }

      self._renderRepoList(repos);
    } catch (err) {
      if (loadingEl) { loadingEl.setAttribute('hidden', ''); }
      if (emptyEl) {
        emptyEl.textContent = 'Failed to load repositories.';
        emptyEl.removeAttribute('hidden');
      }
    }
  }

  /**
   * Renders repositories into the list using the template element.
   * @param {Array} repos - Array of repo objects.
   */
  _renderRepoList(repos) {
    var self = this;
    var listEl = self.shadowRoot.querySelector('[data-repo-list]');
    var templateEl = self.shadowRoot.querySelector('[data-template-repo-item]');

    if (!listEl || !templateEl) {
      return;
    }

    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }

    for (var i = 0; i < repos.length; i++) {
      var repo = repos[i];
      var clone = templateEl.content.cloneNode(true);

      var nameEl = clone.querySelector('[data-repo-name]');
      if (nameEl) {
        nameEl.textContent = repo.full_name || repo.name || '';
      }

      var visibilityEl = clone.querySelector('[data-repo-visibility]');
      if (visibilityEl) {
        visibilityEl.textContent = repo.private ? 'private' : 'public';
      }

      var descEl = clone.querySelector('[data-repo-description]');
      if (descEl) {
        descEl.textContent = repo.description || '';
      }

      var itemEl = clone.querySelector('[data-repo-item]');
      if (itemEl) {
        itemEl.dataset.repoFullName = repo.full_name || repo.name || '';
        itemEl.addEventListener('click', self._onRepoClick.bind(self, repo));
      }

      listEl.appendChild(clone);
    }
  }

  /**
   * Handles clicking a repo item to select it.
   * @param {Object} repo - The repository object.
   */
  _onRepoClick(repo) {
    var self = this;
    self._selectedRepo = repo;

    // Update selected state visually
    var items = self.shadowRoot.querySelectorAll('[data-repo-item]');
    for (var i = 0; i < items.length; i++) {
      if (items[i].dataset.repoFullName === (repo.full_name || repo.name)) {
        items[i].setAttribute('data-selected', '');
      } else {
        items[i].removeAttribute('data-selected');
      }
    }

    // Show PR section and action buttons
    var prSection = self.shadowRoot.querySelector('[data-pr-section]');
    if (prSection) {
      prSection.removeAttribute('hidden');
    }

    var createPrBtn = self.shadowRoot.querySelector('[data-create-pr-btn]');
    if (createPrBtn) {
      createPrBtn.removeAttribute('hidden');
    }

    // Hide new repo button when existing repo is selected
    var createRepoBtn = self.shadowRoot.querySelector('[data-create-repo-btn]');
    if (createRepoBtn) {
      createRepoBtn.setAttribute('hidden', '');
    }

    // Update branch name default with repo name
    self._populateDefaults();
  }

  /**
   * Filters the repo list by search query.
   * @param {string} query - The search string.
   */
  _filterRepos(query) {
    var self = this;
    var normalizedQuery = (query || '').toLowerCase();
    var items = self.shadowRoot.querySelectorAll('[data-repo-item]');

    for (var i = 0; i < items.length; i++) {
      var fullName = (items[i].dataset.repoFullName || '').toLowerCase();
      if (!normalizedQuery || fullName.indexOf(normalizedQuery) !== -1) {
        items[i].style.display = '';
      } else {
        items[i].style.display = 'none';
      }
    }
  }

  /**
   * Toggles the new repository creation mode.
   */
  _toggleNewRepoMode() {
    var self = this;
    self._isNewRepoMode = !self._isNewRepoMode;

    var fieldsEl = self.shadowRoot.querySelector('[data-new-repo-fields]');
    var createRepoBtn = self.shadowRoot.querySelector('[data-create-repo-btn]');
    var createPrBtn = self.shadowRoot.querySelector('[data-create-pr-btn]');

    if (self._isNewRepoMode) {
      if (fieldsEl) { fieldsEl.removeAttribute('hidden'); }
      if (createRepoBtn) { createRepoBtn.removeAttribute('hidden'); }
      if (createPrBtn) { createPrBtn.setAttribute('hidden', ''); }

      // Deselect any selected repo
      self._selectedRepo = null;
      var items = self.shadowRoot.querySelectorAll('[data-repo-item]');
      for (var i = 0; i < items.length; i++) {
        items[i].removeAttribute('data-selected');
      }

      // Hide PR section (new repo doesn't need it)
      var prSection = self.shadowRoot.querySelector('[data-pr-section]');
      if (prSection) {
        prSection.setAttribute('hidden', '');
      }
    } else {
      if (fieldsEl) { fieldsEl.setAttribute('hidden', ''); }
      if (createRepoBtn) { createRepoBtn.setAttribute('hidden', ''); }
      self._hideActionButtons();
    }
  }

  /**
   * Populates form fields with sensible defaults.
   */
  _populateDefaults() {
    var self = this;
    var filename = store.get('filename') || 'AGENTS.md';
    var timestamp = Date.now();

    var filePathInput = self.shadowRoot.querySelector('[data-file-path]');
    if (filePathInput && !filePathInput.value) {
      filePathInput.value = filename;
    }

    var branchInput = self.shadowRoot.querySelector('[data-branch-name]');
    if (branchInput && !branchInput.value) {
      branchInput.value = 'agentsdotmd/add-' + filename.toLowerCase().replace(/\./g, '-') + '-' + timestamp;
    }

    var commitInput = self.shadowRoot.querySelector('[data-commit-message]');
    if (commitInput && !commitInput.value) {
      commitInput.value = 'Add ' + filename + ' via AgentsDotMD';
    }

    var prTitleInput = self.shadowRoot.querySelector('[data-pr-title]');
    if (prTitleInput && !prTitleInput.value) {
      prTitleInput.value = 'Add ' + filename + ' — generated by AgentsDotMD';
    }

    var prBodyInput = self.shadowRoot.querySelector('[data-pr-body]');
    if (prBodyInput && !prBodyInput.value) {
      prBodyInput.value = 'This pull request adds a generated ' + filename + ' file with project conventions and best practices.\n\nGenerated by [AgentsDotMD](https://agentsdotmd.com).';
    }
  }

  /**
   * Hides the primary action buttons.
   */
  _hideActionButtons() {
    var self = this;
    var createPrBtn = self.shadowRoot.querySelector('[data-create-pr-btn]');
    var createRepoBtn = self.shadowRoot.querySelector('[data-create-repo-btn]');
    if (createPrBtn) { createPrBtn.setAttribute('hidden', ''); }
    if (createRepoBtn) { createRepoBtn.setAttribute('hidden', ''); }
  }

  /**
   * Gathers the files to be committed (generated markdown + template files).
   * @returns {Array<{ path: string, content: string }>}
   */
  _gatherFiles() {
    var filePath = (this.shadowRoot.querySelector('[data-file-path]') || {}).value || '';
    var generatedMarkdown = store.get('generatedMarkdown') || '';
    var templateFiles = store.get('templateFiles') || [];
    var filename = store.get('filename') || 'AGENTS.md';

    // Normalize file path
    var basePath = filePath.replace(/^\/+/, '').replace(/\/+$/, '');
    var mdPath = basePath ? basePath + '/' + filename : filename;

    var files = [{ path: mdPath, content: generatedMarkdown }];

    for (var i = 0; i < templateFiles.length; i++) {
      var tmpl = templateFiles[i];
      var tmplPath = basePath ? basePath + '/' + (tmpl.outputPath || tmpl.sourcePath) : (tmpl.outputPath || tmpl.sourcePath);
      files.push({ path: tmplPath, content: tmpl.content || '' });
    }

    return files;
  }

  /**
   * Creates a pull request on the selected repository.
   */
  async _createPullRequest() {
    var self = this;

    if (!self._selectedRepo) {
      eventBus.emit(TOAST_SHOW, { message: 'Please select a repository.', type: 'error' });
      return;
    }

    var branchName = (self.shadowRoot.querySelector('[data-branch-name]') || {}).value || '';
    var commitMessage = (self.shadowRoot.querySelector('[data-commit-message]') || {}).value || '';
    var prTitle = (self.shadowRoot.querySelector('[data-pr-title]') || {}).value || '';
    var prBody = (self.shadowRoot.querySelector('[data-pr-body]') || {}).value || '';
    var files = self._gatherFiles();

    if (!branchName || !commitMessage || !prTitle) {
      eventBus.emit(TOAST_SHOW, { message: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    self._showStatus('Creating pull request...');
    self._setLoading(true);

    try {
      var response = await fetchWithAuth('/api/github/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: self._selectedRepo.full_name || self._selectedRepo.name,
          files: files,
          branchName: branchName,
          commitMessage: commitMessage,
          prTitle: prTitle,
          prBody: prBody
        })
      });

      if (!response.ok) {
        var errData = await response.json().catch(function() { return {}; });
        throw new Error(errData.message || 'Failed to create pull request');
      }

      var result = await response.json();
      self._showStatus('Pull request created successfully!');
      self._showStatusLink(result.html_url || result.url || '', 'View Pull Request');
      eventBus.emit(TOAST_SHOW, { message: 'Pull request created!', type: 'success' });

    } catch (err) {
      self._showStatus('Error: ' + (err.message || 'Failed to create pull request'));
      eventBus.emit(TOAST_SHOW, { message: err.message || 'PR creation failed.', type: 'error' });
    } finally {
      self._setLoading(false);
    }
  }

  /**
   * Creates a new repository and commits generated files to it.
   */
  async _createNewRepo() {
    var self = this;

    var repoName = (self.shadowRoot.querySelector('[data-new-repo-name]') || {}).value || '';
    var repoDesc = (self.shadowRoot.querySelector('[data-new-repo-description]') || {}).value || '';
    var isPrivate = (self.shadowRoot.querySelector('[data-new-repo-private]') || {}).checked || false;

    if (!repoName) {
      eventBus.emit(TOAST_SHOW, { message: 'Please enter a repository name.', type: 'error' });
      return;
    }

    var files = self._gatherFiles();

    self._showStatus('Creating repository...');
    self._setLoading(true);

    try {
      var response = await fetchWithAuth('/api/github/create-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: repoName,
          description: repoDesc,
          private: isPrivate,
          files: files
        })
      });

      if (!response.ok) {
        var errData = await response.json().catch(function() { return {}; });
        throw new Error(errData.message || 'Failed to create repository');
      }

      var result = await response.json();
      self._showStatus('Repository created successfully!');
      self._showStatusLink(result.html_url || result.url || '', 'View Repository');
      eventBus.emit(TOAST_SHOW, { message: 'Repository created!', type: 'success' });

    } catch (err) {
      self._showStatus('Error: ' + (err.message || 'Failed to create repository'));
      eventBus.emit(TOAST_SHOW, { message: err.message || 'Repository creation failed.', type: 'error' });
    } finally {
      self._setLoading(false);
    }
  }

  /**
   * Shows the status section with a message.
   * @param {string} message
   */
  _showStatus(message) {
    var self = this;
    var section = self.shadowRoot.querySelector('[data-status-section]');
    var messageEl = self.shadowRoot.querySelector('[data-status-message]');
    var linkEl = self.shadowRoot.querySelector('[data-status-link]');

    if (section) { section.removeAttribute('hidden'); }
    if (messageEl) { messageEl.textContent = message; }
    if (linkEl) { linkEl.setAttribute('hidden', ''); }
  }

  /**
   * Shows a link in the status section.
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
   * Sets the loading state on action buttons.
   * @param {boolean} loading
   */
  _setLoading(loading) {
    var self = this;
    var createPrBtn = self.shadowRoot.querySelector('[data-create-pr-btn]');
    var createRepoBtn = self.shadowRoot.querySelector('[data-create-repo-btn]');
    var prLabel = self.shadowRoot.querySelector('[data-create-pr-label]');

    if (loading) {
      if (createPrBtn) { createPrBtn.setAttribute('disabled', ''); }
      if (createRepoBtn) { createRepoBtn.setAttribute('disabled', ''); }
      if (prLabel) { prLabel.textContent = 'Creating...'; }
    } else {
      if (createPrBtn) { createPrBtn.removeAttribute('disabled'); }
      if (createRepoBtn) { createRepoBtn.removeAttribute('disabled'); }
      if (prLabel) { prLabel.textContent = 'Create Pull Request'; }
    }
  }
}

customElements.define('github-commit', GithubCommit);
