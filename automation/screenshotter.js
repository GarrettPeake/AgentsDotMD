const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.argv[2] || 'http://localhost:8787';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${name}.png`),
    fullPage: true,
  });
  console.log(`  captured: ${name}.png`);
}

async function captureInBothViewports(page, baseName, setup) {
  // Desktop
  await page.setViewportSize(DESKTOP_VIEWPORT);
  if (setup) await setup(page);
  await page.waitForTimeout(300);
  await screenshot(page, `${baseName}-desktop`);

  // Mobile
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.waitForTimeout(300);
  await screenshot(page, `${baseName}-mobile`);

  // Reset to desktop for further navigation
  await page.setViewportSize(DESKTOP_VIEWPORT);
}

/**
 * Wait for the workspace-view component and a nested component within it.
 * Path: app-root shadowRoot -> workspace-view shadowRoot -> component shadowRoot -> selector
 */
async function waitForWorkspaceComponent(page, componentTag, innerSelector, timeout = 10000) {
  await page.waitForFunction(
    ([tag, sel]) => {
      const appRoot = document.querySelector('app-root');
      if (!appRoot || !appRoot.shadowRoot) return false;
      const workspace = appRoot.shadowRoot.querySelector('workspace-view');
      if (!workspace || !workspace.shadowRoot) return false;
      const comp = workspace.shadowRoot.querySelector(tag);
      if (!comp || !comp.shadowRoot) return false;
      if (sel) return !!comp.shadowRoot.querySelector(sel);
      return true;
    },
    [componentTag, innerSelector],
    { timeout }
  );
}

/**
 * Helper: query inside nested shadow DOMs via workspace.
 */
function wsDeepQuery(componentTag, selector) {
  return `document.querySelector('app-root').shadowRoot.querySelector('workspace-view').shadowRoot.querySelector('${componentTag}').shadowRoot.querySelector('${selector}')`;
}

/**
 * Wait for a direct child component of app-root (for non-workspace routes).
 */
async function waitForComponent(page, componentTag, innerSelector, timeout = 10000) {
  await page.waitForFunction(
    ([tag, sel]) => {
      const appRoot = document.querySelector('app-root');
      if (!appRoot || !appRoot.shadowRoot) return false;
      const comp = appRoot.shadowRoot.querySelector(tag);
      if (!comp || !comp.shadowRoot) return false;
      if (sel) return !!comp.shadowRoot.querySelector(sel);
      return true;
    },
    [componentTag, innerSelector],
    { timeout }
  );
}

async function run() {
  // Clear old screenshots
  if (fs.existsSync(SCREENSHOTS_DIR)) {
    const old = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    for (const file of old) {
      fs.unlinkSync(path.join(SCREENSHOTS_DIR, file));
    }
    console.log(`Cleared ${old.length} old screenshots\n`);
  } else {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  console.log(`Starting screenshot capture against ${BASE_URL}\n`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
  const page = await context.newPage();

  // ── Workspace: Single-page layout (/) ──────────────────────────────

  console.log('Page 1: Workspace — Initial State');

  await page.goto(`${BASE_URL}/#/`);
  await waitForWorkspaceComponent(page, 'tech-catalog', '[data-catalog-grid]');
  // Wait for cards to render (manifest fetch + render)
  await page.waitForTimeout(2000);

  await captureInBothViewports(page, '01-workspace-initial');

  // Search interaction
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const ws = appRoot.shadowRoot.querySelector('workspace-view');
    const catalog = ws.shadowRoot.querySelector('tech-catalog');
    const input = catalog.shadowRoot.querySelector('[data-search-input]');
    if (input) {
      input.value = 'React';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForTimeout(500);
  await captureInBothViewports(page, '02-workspace-search');

  // Clear search
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const ws = appRoot.shadowRoot.querySelector('workspace-view');
    const catalog = ws.shadowRoot.querySelector('tech-catalog');
    const input = catalog.shadowRoot.querySelector('[data-search-input]');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForTimeout(300);

  // Click category filter
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const ws = appRoot.shadowRoot.querySelector('workspace-view');
    const catalog = ws.shadowRoot.querySelector('tech-catalog');
    const btn = catalog.shadowRoot.querySelector('.filter-btn[data-category="backend"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await captureInBothViewports(page, '03-workspace-filtered');

  // Reset to "All"
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const ws = appRoot.shadowRoot.querySelector('workspace-view');
    const catalog = ws.shadowRoot.querySelector('tech-catalog');
    const btn = catalog.shadowRoot.querySelector('.filter-btn[data-category="all"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(300);

  // Select 3 technologies by clicking tech-card elements
  const selectedCount = await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const ws = appRoot.shadowRoot.querySelector('workspace-view');
    const catalog = ws.shadowRoot.querySelector('tech-catalog');
    const cards = catalog.shadowRoot.querySelectorAll('tech-card');
    let clicked = 0;
    for (let i = 0; i < Math.min(3, cards.length); i++) {
      cards[i].click();
      clicked++;
    }
    return clicked;
  });
  console.log(`  selected ${selectedCount} technologies`);
  await page.waitForTimeout(2000);

  console.log('Page 2: Workspace — With Selections + Options + Preview');
  await captureInBothViewports(page, '04-workspace-selected');

  // Toggle an option
  const toggledOption = await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const ws = appRoot.shadowRoot.querySelector('workspace-view');
    const panel = ws.shadowRoot.querySelector('option-panel');
    if (!panel || !panel.shadowRoot) return false;

    const checkbox = panel.shadowRoot.querySelector('.toggle-row');
    if (checkbox) { checkbox.click(); return 'checkbox'; }

    const radio = panel.shadowRoot.querySelector('.radio-row:not(.selected)');
    if (radio) { radio.click(); return 'radio'; }

    return false;
  });

  if (toggledOption) {
    console.log(`  toggled: ${toggledOption}`);
    await page.waitForTimeout(1500);
    await captureInBothViewports(page, '05-workspace-configured');
  }

  // Scroll the preview pane to show fragment content
  const scrolled = await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    if (!appRoot || !appRoot.shadowRoot) return false;
    const ws = appRoot.shadowRoot.querySelector('workspace-view');
    if (!ws || !ws.shadowRoot) return false;
    const output = ws.shadowRoot.querySelector('[data-markdown-output]');
    if (!output) return false;
    output.scrollTop = output.scrollHeight;
    return true;
  });
  if (scrolled) {
    await page.waitForTimeout(500);
    console.log('Page 2b: Workspace — Preview scrolled to bottom');
    await captureInBothViewports(page, '05b-workspace-preview-scrolled');
  }

  // ── GitHub Commit (/github-commit) ────────────────────────────────

  console.log('Page 3: GitHub Commit');

  await page.goto(`${BASE_URL}/#/github-commit`);
  await page.waitForTimeout(1500);

  try {
    await waitForComponent(page, 'github-commit', '.github-commit', 5000);
  } catch {
    // Component may not have inner class, just wait
  }
  await page.waitForTimeout(500);

  await captureInBothViewports(page, '06-github-commit-unauthenticated');

  // ── Done ──────────────────────────────────────────────────────────

  await browser.close();

  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  console.log(`\nDone! ${files.length} screenshots saved to automation/screenshots/`);
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
