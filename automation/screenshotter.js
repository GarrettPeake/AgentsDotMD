const { chromium } = require('playwright');
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
 * Helper: query inside nested shadow DOMs.
 * Path: app-root shadowRoot → component tag → component shadowRoot → selector
 */
function deepQuery(componentTag, selector) {
  return `document.querySelector('app-root').shadowRoot.querySelector('${componentTag}').shadowRoot.querySelector('${selector}')`;
}

function deepQueryAll(componentTag, selector) {
  return `document.querySelector('app-root').shadowRoot.querySelector('${componentTag}').shadowRoot.querySelectorAll('${selector}')`;
}

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
  console.log(`Starting screenshot capture against ${BASE_URL}\n`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
  const page = await context.newPage();

  // ── Step 1: Tech Catalog (/) ──────────────────────────────────────────

  console.log('Page 1: Tech Catalog');

  await page.goto(`${BASE_URL}/#/`);
  await waitForComponent(page, 'tech-catalog', '[data-catalog-grid]');
  // Wait for cards to render (manifest fetch + render)
  await page.waitForTimeout(2000);

  await captureInBothViewports(page, '01-tech-catalog-initial');

  // Search interaction
  const hasSearch = await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const catalog = appRoot.shadowRoot.querySelector('tech-catalog');
    const input = catalog.shadowRoot.querySelector('[data-search-input]');
    return !!input;
  });

  if (hasSearch) {
    // Type into the search input via evaluate + dispatch events
    await page.evaluate(() => {
      const appRoot = document.querySelector('app-root');
      const catalog = appRoot.shadowRoot.querySelector('tech-catalog');
      const input = catalog.shadowRoot.querySelector('[data-search-input]');
      input.value = 'React';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(500);
    await captureInBothViewports(page, '02-tech-catalog-search');

    // Clear search
    await page.evaluate(() => {
      const appRoot = document.querySelector('app-root');
      const catalog = appRoot.shadowRoot.querySelector('tech-catalog');
      const input = catalog.shadowRoot.querySelector('[data-search-input]');
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(300);
  }

  // Click category filter
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const catalog = appRoot.shadowRoot.querySelector('tech-catalog');
    const btn = catalog.shadowRoot.querySelector('.filter-btn[data-category="frontend"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await captureInBothViewports(page, '03-tech-catalog-filtered');

  // Reset to "All"
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const catalog = appRoot.shadowRoot.querySelector('tech-catalog');
    const btn = catalog.shadowRoot.querySelector('.filter-btn[data-category="all"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(300);

  // Select technologies by clicking tech-card elements
  const selectedCount = await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const catalog = appRoot.shadowRoot.querySelector('tech-catalog');
    const cards = catalog.shadowRoot.querySelectorAll('tech-card');
    let clicked = 0;
    for (let i = 0; i < Math.min(3, cards.length); i++) {
      cards[i].click();
      clicked++;
    }
    return clicked;
  });
  console.log(`  selected ${selectedCount} technologies`);
  await page.waitForTimeout(500);

  await captureInBothViewports(page, '04-tech-catalog-selected');

  // Navigate to configure via the Continue button
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const catalog = appRoot.shadowRoot.querySelector('tech-catalog');
    const btn = catalog.shadowRoot.querySelector('[data-continue-btn]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // ── Step 2: Option Panel (/configure) ─────────────────────────────────

  console.log('Page 2: Option Panel');

  await waitForComponent(page, 'option-panel', '.option-panel');
  await page.waitForTimeout(1000);

  await captureInBothViewports(page, '05-option-panel-initial');

  // Toggle a checkbox or select a different radio
  const toggledOption = await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const panel = appRoot.shadowRoot.querySelector('option-panel');
    if (!panel || !panel.shadowRoot) return false;

    // Try toggling a checkbox
    const checkbox = panel.shadowRoot.querySelector('.checkbox-input');
    if (checkbox) { checkbox.click(); return 'checkbox'; }

    // Try clicking an unchecked radio
    const radio = panel.shadowRoot.querySelector('.radio-input:not(:checked)');
    if (radio) { radio.click(); return 'radio'; }

    return false;
  });

  if (toggledOption) {
    console.log(`  toggled: ${toggledOption}`);
    await page.waitForTimeout(500);
    await captureInBothViewports(page, '06-option-panel-configured');
  }

  // Navigate to preview
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const panel = appRoot.shadowRoot.querySelector('option-panel');
    const btn = panel.shadowRoot.querySelector('[data-continue-btn]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);

  // ── Step 3: File Preview (/preview) ───────────────────────────────────

  console.log('Page 3: File Preview');

  await waitForComponent(page, 'file-preview', '.file-preview');
  await page.waitForTimeout(1500);

  await captureInBothViewports(page, '07-file-preview-initial');

  // Click Edit on first fragment
  const clickedEdit = await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const preview = appRoot.shadowRoot.querySelector('file-preview');
    if (!preview || !preview.shadowRoot) return false;
    const editBtn = preview.shadowRoot.querySelector('[data-edit-btn]');
    if (editBtn) { editBtn.click(); return true; }
    return false;
  });

  if (clickedEdit) {
    console.log('  opened fragment editor');
    await page.waitForTimeout(500);
    await captureInBothViewports(page, '08-file-preview-editing');

    // Cancel the edit
    await page.evaluate(() => {
      const appRoot = document.querySelector('app-root');
      const preview = appRoot.shadowRoot.querySelector('file-preview');
      const cancelBtn = preview.shadowRoot.querySelector('[data-cancel-btn]');
      if (cancelBtn) cancelBtn.click();
    });
    await page.waitForTimeout(300);
  }

  // Switch to Templates tab
  const clickedTab = await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const preview = appRoot.shadowRoot.querySelector('file-preview');
    if (!preview || !preview.shadowRoot) return false;
    const tabBtn = preview.shadowRoot.querySelector('[data-tab-btn="templates"]');
    if (tabBtn) { tabBtn.click(); return true; }
    return false;
  });

  if (clickedTab) {
    console.log('  switched to templates tab');
    await page.waitForTimeout(500);
    await captureInBothViewports(page, '09-file-preview-templates');
  }

  // Navigate to export
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const preview = appRoot.shadowRoot.querySelector('file-preview');
    const btn = preview.shadowRoot.querySelector('[data-continue-btn]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // ── Step 4: Delivery Options (/export) ────────────────────────────────

  console.log('Page 4: Delivery Options');

  await waitForComponent(page, 'delivery-options', '.delivery-options');
  await page.waitForTimeout(1000);

  await captureInBothViewports(page, '10-delivery-options-download');

  // Select "Inline Instructions" mode
  const selectedInline = await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const delivery = appRoot.shadowRoot.querySelector('delivery-options');
    if (!delivery || !delivery.shadowRoot) return false;
    const radio = delivery.shadowRoot.querySelector('.mode-radio[value="inline"]');
    if (radio) { radio.click(); return true; }
    return false;
  });

  if (selectedInline) {
    await page.waitForTimeout(500);
    await captureInBothViewports(page, '11-delivery-options-inline');
  }

  // Select "Copy-Paste" mode
  const selectedCopy = await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    const delivery = appRoot.shadowRoot.querySelector('delivery-options');
    if (!delivery || !delivery.shadowRoot) return false;
    const radio = delivery.shadowRoot.querySelector('.mode-radio[value="copypaste"]');
    if (radio) { radio.click(); return true; }
    return false;
  });

  if (selectedCopy) {
    await page.waitForTimeout(500);
    await captureInBothViewports(page, '12-delivery-options-copypaste');
  }

  // ── Step 5: GitHub Commit (/github-commit) ────────────────────────────

  console.log('Page 5: GitHub Commit');

  await page.goto(`${BASE_URL}/#/github-commit`);
  await page.waitForTimeout(1500);

  try {
    await waitForComponent(page, 'github-commit', '.github-commit', 5000);
  } catch {
    // Component may not have inner class, just wait
  }
  await page.waitForTimeout(500);

  await captureInBothViewports(page, '13-github-commit-unauthenticated');

  // ── Done ──────────────────────────────────────────────────────────────

  await browser.close();

  const files = require('fs').readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  console.log(`\nDone! ${files.length} screenshots saved to automation/screenshots/`);
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
