const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const base = 'http://localhost:3020';
  
  console.log('Navigating to dashboard...');
  await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: '/tmp/kanclaw/screenshots/05-dashboard-new.png', fullPage: true });
  console.log('Dashboard screenshot saved');
  
  await browser.close();
  console.log('Done!');
})();
