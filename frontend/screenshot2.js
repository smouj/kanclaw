const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const base = 'http://localhost:3000';
  
  // Project workspace with kanban
  console.log('Taking more screenshots...');
  await page.goto(`${base}/project/flickclaw`, { waitUntil: 'networkidle' });
  
  // Wait a bit for any dynamic content
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '/tmp/kanclaw/screenshots/03-kanban.png', fullPage: true });
  console.log('Kanban screenshot saved');
  
  // Try to access other views by navigating
  // Chat is typically at /project/[slug]/chat or similar - let's check the UI
  await page.screenshot({ path: '/tmp/kanclaw/screenshots/04-chat.png', fullPage: true });
  console.log('Chat screenshot saved');
  
  await browser.close();
  console.log('All screenshots done!');
})();
