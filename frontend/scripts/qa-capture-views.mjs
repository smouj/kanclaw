#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.KANCLAW_BASE_URL || 'http://127.0.0.1:3020';
const PROJECT_SLUG = process.env.KANCLAW_QA_PROJECT || 'rpgclaw';
const OUT_DIR = '/home/smouj/apps/kanclaw/qa/screenshots';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1920, height: 1080 },
];

const MODES = ['dark', 'light'];
const VIEWS = [
  { idx: 0, name: 'overview' },
  { idx: 1, name: 'chat' },
  { idx: 2, name: 'board' },
  { idx: 3, name: 'memory' },
  { idx: 4, name: 'files' },
  { idx: 5, name: 'connectors' },
];

mkdirSync(OUT_DIR, { recursive: true });

async function openView(page, viewport, viewIndex) {
  if (viewport.width < 768) {
    const toggle = page.locator('button[aria-label="Toggle left sidebar"]');
    if (await toggle.count()) {
      await toggle.first().click();
      await page.waitForTimeout(120);
    }
  }

  const tabs = page.locator('[data-testid^="workspace-tab-"]');
  const count = await tabs.count();
  if (viewIndex >= count) {
    throw new Error(`Tab index ${viewIndex} not available, count=${count}`);
  }
  await tabs.nth(viewIndex).click();
  await page.waitForTimeout(350);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const mode of MODES) {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      await context.addInitScript((activeMode) => {
        localStorage.setItem('kanclaw-theme', activeMode);
      }, mode);

      const page = await context.newPage();
      const url = `${BASE}/project/${PROJECT_SLUG}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(500);

      for (const view of VIEWS) {
        await openView(page, viewport, view.idx);
        const out = join(OUT_DIR, `${mode}-${viewport.name}-${view.name}.png`);
        await page.screenshot({ path: out, fullPage: true });
        console.log(`[qa-capture] ${out}`);
      }

      await context.close();
    }
  }

  await browser.close();
  console.log('[qa-capture] done');
})();
