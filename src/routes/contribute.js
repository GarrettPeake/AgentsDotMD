/**
 * Community contribution handlers.
 * Allows users to submit prompt edits and new fragments as GitHub pull requests,
 * either authenticated (attributed to the user) or anonymously (via bot account).
 */

import GitHubClient from '../utils/github-client.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

/**
 * Determines the file path in the prompt repository based on contribution type.
 * @param {string} type - Contribution type: "edit", "new-fragment", or "new-tech".
 * @param {string} fragmentId - Identifier for the fragment (e.g. "flutter-bloc-state").
 * @returns {string} File path within the prompt repository.
 */
function resolveFilePath(type, fragmentId) {
  if (type === 'new-tech') {
    // New technology: place in technologies/<id>/fragments/<id>.md
    return `technologies/${fragmentId}/fragments/${fragmentId}.md`;
  }
  if (type === 'new-fragment') {
    // New fragment: fragmentId is expected to be in the form "tech/fragment-name"
    // or a simple name; place under technologies directory
    if (fragmentId.includes('/')) {
      const [tech, name] = fragmentId.split('/');
      return `technologies/${tech}/fragments/${name}.md`;
    }
    return `fragments/${fragmentId}.md`;
  }
  // Edit existing fragment: fragmentId maps to technology path
  // fragmentId format: "tech-name-fragment-name" — resolve to the technology directory
  // For edits, the client provides the full path context via fragmentId
  if (fragmentId.includes('/')) {
    return fragmentId;
  }
  // Fallback: treat as a path under technologies
  const parts = fragmentId.split('-');
  const tech = parts[0];
  return `technologies/${tech}/fragments/${fragmentId}.md`;
}

/**
 * Creates a contribution pull request on the prompt repository.
 * @param {GitHubClient} client - Authenticated GitHub client.
 * @param {object} env - Worker environment bindings.
 * @param {object} params - Contribution parameters.
 * @param {string} params.fragmentId - Fragment identifier.
 * @param {string} params.editedContent - New file content.
 * @param {string} params.rationale - Reason for the change.
 * @param {string} params.type - Contribution type.
 * @param {boolean} params.anonymous - Whether this is an anonymous contribution.
 * @returns {Promise<{prUrl: string}>}
 */
async function createContributionPR(client, env, { fragmentId, editedContent, rationale, type, anonymous }) {
  const owner = env.PROMPT_REPO_OWNER;
  const repo = env.PROMPT_REPO_NAME;

  // Create a branch for the contribution
  const branchName = `contrib/${fragmentId}-${Date.now()}`;
  const defaultBranchSha = await client.getDefaultBranchSha(owner, repo);
  await client.createBranch(owner, repo, branchName, defaultBranchSha);

  // Determine file path and commit the content
  const filePath = resolveFilePath(type, fragmentId);

  // Check if the file already exists (for edits)
  const existing = await client.getFileContent(owner, repo, filePath, branchName);
  const existingSha = existing ? existing.sha : null;

  const commitMessage = type === 'edit'
    ? `Edit fragment: ${fragmentId}`
    : `Add new ${type === 'new-tech' ? 'technology' : 'fragment'}: ${fragmentId}`;

  await client.createOrUpdateFile(
    owner,
    repo,
    filePath,
    editedContent,
    commitMessage,
    branchName,
    existingSha,
  );

  // Build PR description
  const repoData = await client.getRepo(owner, repo);
  const defaultBranch = repoData.default_branch;

  const anonymousNote = anonymous
    ? '\n\n> This contribution was submitted anonymously via the AgentsDotMD web tool.'
    : '';

  const prBody = `## Contribution

**Type:** ${type}
**Fragment:** ${fragmentId}

### Rationale

${rationale}${anonymousNote}`;

  const prTitle = type === 'edit'
    ? `Edit: ${fragmentId}`
    : `New ${type === 'new-tech' ? 'technology' : 'fragment'}: ${fragmentId}`;

  // Create the pull request
  const pr = await client.createPullRequest(
    owner,
    repo,
    prTitle,
    prBody,
    branchName,
    defaultBranch,
  );

  return { prUrl: pr.html_url };
}

/**
 * Handles authenticated contribution submissions.
 * Creates a PR attributed to the user on the prompt repository.
 * Expects JSON body: { token, fragmentId, originalContent, editedContent, rationale, type }
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<Response>}
 */
export async function handleSubmit(request, env) {
  try {
    const body = await request.json();
    const { token, fragmentId, editedContent, rationale, type } = body;

    if (!token || !fragmentId || !editedContent || !rationale || !type) {
      return errorResponse(
        'Missing required fields: token, fragmentId, editedContent, rationale, type',
        400,
      );
    }

    const client = new GitHubClient(token);
    const result = await createContributionPR(client, env, {
      fragmentId,
      editedContent,
      rationale,
      type,
      anonymous: false,
    });

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(`Contribution submission failed: ${error.message}`, error.status || 500);
  }
}

/**
 * Handles anonymous contribution submissions.
 * Creates a PR via the bot account on the prompt repository.
 * Expects JSON body: { fragmentId, originalContent, editedContent, rationale, type }
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<Response>}
 */
export async function handleAnonymous(request, env) {
  try {
    const body = await request.json();
    const { fragmentId, editedContent, rationale, type } = body;

    if (!fragmentId || !editedContent || !rationale || !type) {
      return errorResponse(
        'Missing required fields: fragmentId, editedContent, rationale, type',
        400,
      );
    }

    const client = new GitHubClient(env.GITHUB_BOT_TOKEN);
    const result = await createContributionPR(client, env, {
      fragmentId,
      editedContent,
      rationale,
      type,
      anonymous: true,
    });

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(`Anonymous contribution failed: ${error.message}`, error.status || 500);
  }
}
