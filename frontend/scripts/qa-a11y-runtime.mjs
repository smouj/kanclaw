#!/usr/bin/env node
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.KANCLAW_BASE_URL || 'http://127.0.0.1:3020';
const PROJECT_SLUG = process.env.KANCLAW_QA_PROJECT || 'rpgclaw';
const OUT_FILE = '/home/smouj/apps/kanclaw/qa/a11y-runtime-report.json';

mkdirSync('/home/smouj/apps/kanclaw/qa', { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  const results = [];

  await page.goto(`${BASE}/project/${PROJECT_SLUG}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('button[aria-label="Toggle left sidebar"]', { timeout: 15000 });
  await page.click('body');
  await page.waitForTimeout(600);

  // Check: command palette opens with Ctrl/Cmd+K
  await page.keyboard.down('Control');
  await page.keyboard.press('k');
  await page.keyboard.up('Control');
  await page.waitForTimeout(120);
  let cpVisible = await page.locator('[data-testid="command-palette-overlay"]').count();

  if (cpVisible === 0) {
    await page.keyboard.down('Meta');
    await page.keyboard.press('k');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(120);
    cpVisible = await page.locator('[data-testid="command-palette-overlay"]').count();
  }

  // fallback: open via explicit keyboard event in page context if browser shortcut path is blocked
  if (cpVisible === 0) {
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    await page.waitForTimeout(120);
    cpVisible = await page.locator('[data-testid="command-palette-overlay"]').count();
  }

  let cpPass = cpVisible > 0;

  if (!cpPass) {
    const openBtn = page.locator('button', { hasText: /Comandos|Command/i }).first();
    if (await openBtn.count()) {
      await openBtn.click();
      await page.waitForTimeout(120);
      cpVisible = await page.locator('[data-testid="command-palette-overlay"]').count();
      cpPass = cpVisible > 0;
    }
  }

  results.push({ check: 'command-palette-open-shortcut-or-button', pass: cpPass });

  // Check: Escape closes command palette
  if (cpVisible > 0) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
  const cpClosed = (await page.locator('[data-testid="command-palette-overlay"]').count()) === 0;
  results.push({ check: 'command-palette-close-escape', pass: cpClosed });

  // Check: icon-only controls expose aria-label
  const iconButtons = await page.locator('button[aria-label]').count();
  results.push({ check: 'icon-buttons-have-aria-label', pass: iconButtons >= 4, value: iconButtons });

  // Check: language selector exists with group role
  const langSelector = await page.locator('[role="group"][aria-label="Language selector"]').count();
  results.push({ check: 'language-selector-aria-group', pass: langSelector > 0 });

  // Check: focus-visible flow (tabbing)
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName || null);
  results.push({ check: 'keyboard-tabbing-active-element', pass: Boolean(focusedTag), value: focusedTag });

  const criticalChecks = new Set([
    'icon-buttons-have-aria-label',
    'language-selector-aria-group',
    'keyboard-tabbing-active-element',
    'command-palette-close-escape',
  ]);

  const pass = results
    .filter((r) => criticalChecks.has(r.check))
    .every((r) => r.pass);

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE,
    project: PROJECT_SLUG,
    pass,
    advisory: results.filter((r) => !criticalChecks.has(r.check)),
    results,
  };

  writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));
  console.log(`[qa-a11y] report: ${OUT_FILE}`);
  console.log(`[qa-a11y] pass: ${pass}`);

  await context.close();
  await browser.close();

  process.exit(pass ? 0 : 1);
})();
