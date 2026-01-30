/**
 * GitHub OAuth client module.
 * Manages authentication flow via popup window and token lifecycle.
 */
import { store } from './store.js';
import { eventBus, AUTH_SUCCESS, AUTH_LOGOUT } from './event-bus.js';

const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 700;

/**
 * Opens a popup window to start the GitHub OAuth flow.
 * Listens for a postMessage from the callback page containing the token.
 */
export function startAuth() {
  const left = Math.round((screen.width - POPUP_WIDTH) / 2);
  const top = Math.round((screen.height - POPUP_HEIGHT) / 2);
  const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`;

  const popup = window.open('/api/auth/github', 'github-oauth', features);

  function onMessage(event) {
    if (event.origin !== window.location.origin) {
      return;
    }

    if (event.data && event.data.type === 'github-oauth' && event.data.token) {
      window.removeEventListener('message', onMessage);
      store.set('githubToken', event.data.token);
      eventBus.emit(AUTH_SUCCESS, { token: event.data.token });

      if (popup && !popup.closed) {
        popup.close();
      }
    }
  }

  window.addEventListener('message', onMessage);
}

/**
 * Clears the GitHub token and emits a logout event.
 */
export function logout() {
  store.set('githubToken', null);
  eventBus.emit(AUTH_LOGOUT);
}

/**
 * Returns whether the user is currently authenticated.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!store.get('githubToken');
}

/**
 * Returns the current GitHub token, or null if not authenticated.
 * @returns {string|null}
 */
export function getToken() {
  return store.get('githubToken');
}

/**
 * Fetch wrapper that adds the Authorization: Bearer header.
 * @param {string} url - The URL to fetch.
 * @param {RequestInit} [options={}] - Fetch options.
 * @returns {Promise<Response>}
 */
export async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
