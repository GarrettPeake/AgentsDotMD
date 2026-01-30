/**
 * Response utility helpers for the Cloudflare Worker API.
 * Provides JSON responses, error responses, and CORS preflight handling.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Returns a Response with a JSON body, proper Content-Type, and CORS headers.
 * @param {unknown} data - The data to serialize as JSON.
 * @param {number} status - HTTP status code (default 200).
 * @returns {Response}
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Returns a JSON error response with { error: message }.
 * @param {string} message - The error message.
 * @param {number} status - HTTP status code (default 400).
 * @returns {Response}
 */
export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

/**
 * Returns a 204 No Content response with CORS headers for OPTIONS preflight requests.
 * @returns {Response}
 */
export function corsPreflightResponse() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
