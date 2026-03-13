const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'dark',
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const base = 'http://localhost:3020';

  console.log('Dashboard screenshot...');
  await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: '/home/smouj/apps/kanclaw/screenshots/01-dashboard.png',
    fullPage: false,
  });

  console.log('Workspace screenshot...');
  await page.goto(`${base}/project/kanclaw-demo`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: '/home/smouj/apps/kanclaw/screenshots/02-workspace.png',
    fullPage: false,
  });

  await browser.close();
  console.log('Done!');
})();
