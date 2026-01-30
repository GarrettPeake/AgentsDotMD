/**
 * GitHub API wrapper for the Cloudflare Worker backend.
 * Uses the global fetch available in Workers (no node-fetch needed).
 */

const GITHUB_API_BASE = 'https://api.github.com';

export default class GitHubClient {
  /**
   * @param {string} token - GitHub personal access token or OAuth token.
   */
  constructor(token) {
    this.token = token;
  }

  /**
   * Makes an authenticated request to the GitHub API.
   * @param {string} endpoint - API path (e.g. "/user").
   * @param {object} options - Additional fetch options (method, body, etc.).
   * @returns {Promise<unknown>} Parsed JSON response.
   * @throws {Error} If the response is not ok.
   */
  async request(endpoint, options = {}) {
    const url = `${GITHUB_API_BASE}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'AgentsDotMD',
      ...options.headers,
    };

    if (options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || `GitHub API error: ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  /**
   * Get the authenticated user's profile.
   * @returns {Promise<object>}
   */
  async getUser() {
    return this.request('/user');
  }

  /**
   * List the authenticated user's repositories, sorted by most recently updated.
   * @param {number} page - Page number (default 1).
   * @param {number} perPage - Results per page (default 30).
   * @returns {Promise<object[]>}
   */
  async listRepos(page = 1, perPage = 30) {
    return this.request(`/user/repos?sort=updated&page=${page}&per_page=${perPage}`);
  }

  /**
   * Get a specific repository.
   * @param {string} owner - Repository owner.
   * @param {string} repo - Repository name.
   * @returns {Promise<object>}
   */
  async getRepo(owner, repo) {
    return this.request(`/repos/${owner}/${repo}`);
  }

  /**
   * Create a new branch from a given SHA.
   * @param {string} owner - Repository owner.
   * @param {string} repo - Repository name.
   * @param {string} branchName - New branch name.
   * @param {string} fromSha - SHA to branch from.
   * @returns {Promise<object>}
   */
  async createBranch(owner, repo, branchName, fromSha) {
    return this.request(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: {
        ref: `refs/heads/${branchName}`,
        sha: fromSha,
      },
    });
  }

  /**
   * Get the SHA of the default branch HEAD.
   * @param {string} owner - Repository owner.
   * @param {string} repo - Repository name.
   * @returns {Promise<string>} The SHA of the default branch HEAD commit.
   */
  async getDefaultBranchSha(owner, repo) {
    const repoData = await this.getRepo(owner, repo);
    const defaultBranch = repoData.default_branch;
    const refData = await this.request(`/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`);
    return refData.object.sha;
  }

  /**
   * Create or update a file in a repository.
   * @param {string} owner - Repository owner.
   * @param {string} repo - Repository name.
   * @param {string} path - File path within the repository.
   * @param {string} content - File content (will be base64-encoded).
   * @param {string} message - Commit message.
   * @param {string} branch - Target branch name.
   * @param {string|null} existingSha - SHA of the existing file (for updates), or null for creation.
   * @returns {Promise<object>}
   */
  async createOrUpdateFile(owner, repo, path, content, message, branch, existingSha = null) {
    const body = {
      message,
      content: btoa(content),
      branch,
    };

    if (existingSha) {
      body.sha = existingSha;
    }

    return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body,
    });
  }

  /**
   * Create a pull request.
   * @param {string} owner - Repository owner.
   * @param {string} repo - Repository name.
   * @param {string} title - PR title.
   * @param {string} body - PR description.
   * @param {string} head - Head branch name.
   * @param {string} base - Base branch name.
   * @returns {Promise<object>}
   */
  async createPullRequest(owner, repo, title, body, head, base) {
    return this.request(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: {
        title,
        body,
        head,
        base,
      },
    });
  }

  /**
   * Create a new repository for the authenticated user.
   * @param {string} name - Repository name.
   * @param {string} description - Repository description.
   * @param {boolean} isPrivate - Whether the repository is private.
   * @returns {Promise<object>}
   */
  async createRepository(name, description, isPrivate) {
    return this.request('/user/repos', {
      method: 'POST',
      body: {
        name,
        description,
        private: isPrivate,
        auto_init: true,
      },
    });
  }

  /**
   * Get the content of a file from a repository.
   * @param {string} owner - Repository owner.
   * @param {string} repo - Repository name.
   * @param {string} path - File path within the repository.
   * @param {string} ref - Git ref (branch, tag, or commit SHA).
   * @returns {Promise<object|null>} File content object, or null if not found.
   */
  async getFileContent(owner, repo, path, ref) {
    try {
      return await this.request(`/repos/${owner}/${repo}/contents/${path}?ref=${ref}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }
}
