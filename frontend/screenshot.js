const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Wait for server
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/kanclaw/screenshots/01-dashboard.png', fullPage: true });
  console.log('Dashboard screenshot saved');
  
  // Navigate to project workspace
  await page.goto('http://localhost:3000/project/flickclaw', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/kanclaw/screenshots/02-project-workspace.png', fullPage: true });
  console.log('Project workspace screenshot saved');
  
  await browser.close();
  console.log('Done!');
})();
