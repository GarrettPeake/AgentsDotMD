/**
 * GitHub API proxy handlers.
 * Provides repository listing, PR creation, repo creation, and GitHub App endpoints.
 */

import GitHubClient from '../utils/github-client.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

/**
 * Extracts the Bearer token from the Authorization header.
 * @param {Request} request
 * @returns {string|null} The token, or null if missing/invalid.
 */
function extractToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice('Bearer '.length);
}

/**
 * Lists the authenticated user's repositories.
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<Response>}
 */
export async function handleListRepos(request, env) {
  try {
    const token = extractToken(request);
    if (!token) {
      return errorResponse('Missing or invalid Authorization header', 401);
    }

    const client = new GitHubClient(token);
    const repos = await client.listRepos();
    return jsonResponse(repos);
  } catch (error) {
    return errorResponse(`Failed to list repositories: ${error.message}`, error.status || 500);
  }
}

/**
 * Creates a pull request on the user's repository with the generated files.
 * Expects JSON body: { repo, files: [{path, content}], branchName, commitMessage, prTitle, prBody }
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<Response>}
 */
export async function handleCreatePR(request, env) {
  try {
    const token = extractToken(request);
    if (!token) {
      return errorResponse('Missing or invalid Authorization header', 401);
    }

    const body = await request.json();
    const { repo, files, branchName, commitMessage, prTitle, prBody } = body;

    if (!repo || !files || !branchName || !commitMessage || !prTitle) {
      return errorResponse('Missing required fields: repo, files, branchName, commitMessage, prTitle', 400);
    }

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      return errorResponse('Invalid repo format. Expected "owner/name".', 400);
    }

    const client = new GitHubClient(token);

    // Get default branch SHA
    const defaultBranchSha = await client.getDefaultBranchSha(owner, repoName);

    // Get default branch name for PR base
    const repoData = await client.getRepo(owner, repoName);
    const defaultBranch = repoData.default_branch;

    // Create a new branch from the default branch
    await client.createBranch(owner, repoName, branchName, defaultBranchSha);

    // Create or update each file on the new branch
    for (const file of files) {
      // Check if file already exists to get its SHA for updates
      const existing = await client.getFileContent(owner, repoName, file.path, branchName);
      const existingSha = existing ? existing.sha : null;

      await client.createOrUpdateFile(
        owner,
        repoName,
        file.path,
        file.content,
        commitMessage,
        branchName,
        existingSha,
      );
    }

    // Create the pull request
    const pr = await client.createPullRequest(
      owner,
      repoName,
      prTitle,
      prBody || '',
      branchName,
      defaultBranch,
    );

    return jsonResponse({ prUrl: pr.html_url });
  } catch (error) {
    return errorResponse(`Failed to create pull request: ${error.message}`, error.status || 500);
  }
}

/**
 * Creates a new repository and commits the generated files to it.
 * Expects JSON body: { name, description, private, files: [{path, content}] }
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<Response>}
 */
export async function handleCreateRepo(request, env) {
  try {
    const token = extractToken(request);
    if (!token) {
      return errorResponse('Missing or invalid Authorization header', 401);
    }

    const body = await request.json();
    const { name, description, files } = body;
    const isPrivate = body.private || false;

    if (!name || !files) {
      return errorResponse('Missing required fields: name, files', 400);
    }

    const client = new GitHubClient(token);

    // Create the repository (auto_init creates a default branch with a README)
    const newRepo = await client.createRepository(name, description || '', isPrivate);
    const owner = newRepo.owner.login;
    const repoName = newRepo.name;
    const defaultBranch = newRepo.default_branch;

    // Wait briefly for GitHub to initialize the repository
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Commit each file to the default branch
    const filesCreated = [];
    for (const file of files) {
      await client.createOrUpdateFile(
        owner,
        repoName,
        file.path,
        file.content,
        `Add ${file.path}`,
        defaultBranch,
      );
      filesCreated.push(file.path);
    }

    return jsonResponse({
      repoUrl: newRepo.html_url,
      filesCreated,
    });
  } catch (error) {
    return errorResponse(`Failed to create repository: ${error.message}`, error.status || 500);
  }
}

/**
 * Handles GitHub App webhook events.
 * Stub implementation — detects /generate-agent-md command in issue comments.
 * Full implementation requires GitHub App JWT for installation token generation.
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<Response>}
 */
export async function handleAppWebhook(request, env) {
  try {
    const body = await request.json();

    // Detect issue_comment events with /generate-agent-md command
    if (
      body.action === 'created' &&
      body.comment &&
      body.comment.body &&
      body.comment.body.includes('/generate-agent-md')
    ) {
      // Stub: full implementation requires GitHub App installation token (JWT-based)
      // Would post a reply comment with a link to the wizard pre-filled with the repo
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(`Webhook processing failed: ${error.message}`, 500);
  }
}

/**
 * Handles the GitHub App post-installation setup redirect.
 * Redirects to the SPA with the installation context.
 * @param {Request} request
 * @param {object} env
 * @returns {Response}
 */
export async function handleAppSetup(request, env) {
  try {
    const url = new URL(request.url);
    const installationId = url.searchParams.get('installation_id');

    if (!installationId) {
      return errorResponse('Missing installation_id parameter', 400);
    }

    // Redirect to the SPA with installation context
    return Response.redirect(`${url.origin}/?installation_id=${installationId}`, 302);
  } catch (error) {
    return errorResponse(`App setup redirect failed: ${error.message}`, 500);
  }
}
