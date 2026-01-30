/**
 * Application entry point.
 * Bootstraps components, creates the router, and starts the app.
 */
import Router from './router.js';
import { store } from './store.js';
import { eventBus, NAVIGATE } from './event-bus.js';

const COMPONENT_MODULES = [
  '../components/app-root/app-root.js',
  '../components/tech-catalog/tech-catalog.js',
  '../components/tech-card/tech-card.js',
  '../components/option-panel/option-panel.js',
  '../components/file-preview/file-preview.js',
  '../components/template-preview/template-preview.js',
  '../components/delivery-options/delivery-options.js',
  '../components/filename-selector/filename-selector.js',
  '../components/github-commit/github-commit.js',
  '../components/contribution-modal/contribution-modal.js',
  '../components/step-wizard/step-wizard.js',
  '../components/toast-notification/toast-notification.js',
];

async function registerComponents() {
  const results = await Promise.allSettled(
    COMPONENT_MODULES.map(path => import(path))
  );
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(
        `Component module not yet available: ${COMPONENT_MODULES[index]}`
      );
    }
  });
}

function createRouter(outlet) {
  const router = new Router(outlet);
  router.register('/', 'tech-catalog');
  router.register('/configure', 'option-panel');
  router.register('/preview', 'file-preview');
  router.register('/export', 'delivery-options');

  eventBus.on(NAVIGATE, (hash) => router.navigate(hash));

  return router;
}

document.addEventListener('DOMContentLoaded', async () => {
  const appContainer = document.getElementById('app');
  const appRoot = document.createElement('app-root');
  appContainer.appendChild(appRoot);

  await customElements.whenDefined('app-root');

  const outlet = appRoot.shadowRoot.querySelector('[data-router-outlet]');
  if (!outlet) {
    console.error('Router outlet not found in app-root shadow DOM.');
    return;
  }

  const router = createRouter(outlet);
  router.start();

  await registerComponents();
});
