/**
 * AgentsDotMD — Cloudflare Worker entry point.
 * Routes /api/* requests to backend handlers; all other requests serve the SPA.
 */

import { handleAuthRedirect, handleAuthCallback } from './routes/auth.js';
import { handleListRepos, handleCreatePR, handleCreateRepo, handleAppWebhook, handleAppSetup } from './routes/github.js';
import { handleSubmit, handleAnonymous } from './routes/contribute.js';
import { corsPreflightResponse, errorResponse } from './utils/response.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      // Handle CORS preflight for all API routes
      if (request.method === 'OPTIONS') {
        return corsPreflightResponse();
      }

      return handleApi(url, request, env);
    }

    // All other requests: serve static assets (SPA)
    return env.ASSETS.fetch(request);
  },
};

/**
 * Dispatches API requests to the appropriate route handler.
 * @param {URL} url - Parsed request URL.
 * @param {Request} request - Incoming request.
 * @param {object} env - Worker environment bindings.
 * @returns {Promise<Response>}
 */
async function handleApi(url, request, env) {
  const path = url.pathname;

  if (path === '/api/auth/github')          return handleAuthRedirect(request, env);
  if (path === '/api/auth/callback')        return handleAuthCallback(request, env);
  if (path === '/api/github/repos')         return handleListRepos(request, env);
  if (path === '/api/github/pr')            return handleCreatePR(request, env);
  if (path === '/api/github/create-repo')   return handleCreateRepo(request, env);
  if (path === '/api/contribute/submit')    return handleSubmit(request, env);
  if (path === '/api/contribute/anonymous') return handleAnonymous(request, env);
  if (path === '/api/github-app/webhook')   return handleAppWebhook(request, env);
  if (path === '/api/github-app/setup')     return handleAppSetup(request, env);

  return errorResponse('Not Found', 404);
}
