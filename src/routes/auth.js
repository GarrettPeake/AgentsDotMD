/**
 * GitHub OAuth flow handlers.
 * Handles the redirect to GitHub and the callback token exchange.
 */

import { errorResponse } from '../utils/response.js';

/**
 * Redirects the user to GitHub's OAuth authorization page.
 * Generates a random state parameter for CSRF protection.
 * @param {Request} request - Incoming request.
 * @param {object} env - Worker environment bindings.
 * @returns {Response} 302 redirect to GitHub OAuth.
 */
export async function handleAuthRedirect(request, env) {
  try {
    const state = crypto.randomUUID();
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/api/auth/callback`;

    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'public_repo',
      state,
    });

    return Response.redirect(
      `https://github.com/login/oauth/authorize?${params.toString()}`,
      302,
    );
  } catch (error) {
    return errorResponse(`OAuth redirect failed: ${error.message}`, 500);
  }
}

/**
 * Handles the GitHub OAuth callback.
 * Exchanges the authorization code for an access token, then returns an HTML page
 * that posts the token to the opener window via postMessage and closes itself.
 * @param {Request} request - Incoming request.
 * @param {object} env - Worker environment bindings.
 * @returns {Promise<Response>} HTML page that relays the token to the SPA.
 */
export async function handleAuthCallback(request, env) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      return errorResponse('Missing authorization code', 400);
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return errorResponse(`GitHub token exchange failed: ${tokenData.error_description || tokenData.error}`, 400);
    }

    const accessToken = tokenData.access_token;

    // Return an HTML page that sends the token to the opener window via postMessage
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AgentsDotMD — GitHub Authorization</title>
</head>
<body>
  <p>Authorizing&hellip;</p>
  <script>
    if (window.opener) {
      window.opener.postMessage(
        { type: 'github-oauth', token: '${accessToken}' },
        window.location.origin
      );
    }
    window.close();
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    return errorResponse(`OAuth callback failed: ${error.message}`, 500);
  }
}
