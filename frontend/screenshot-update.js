const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const base = 'http://localhost:3020';
  
  console.log('Taking screenshot: Dashboard...');
  await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: '/home/smouj/apps/kanclaw/screenshots/01-dashboard.png', fullPage: true });
  
  console.log('Taking screenshot: Project Workspace...');
  await page.goto(`${base}/project/kanclaw-demo`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: '/home/smouj/apps/kanclaw/screenshots/02-workspace.png', fullPage: true });
  
  console.log('Taking screenshot: Chat View...');
  await page.click('button:has-text("Chat")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/smouj/apps/kanclaw/screenshots/03-chat.png', fullPage: true });
  
  console.log('Taking screenshot: Kanban Board...');
  await page.click('button:has-text("Board")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/smouj/apps/kanclaw/screenshots/04-kanban.png', fullPage: true });
  
  console.log('Taking screenshot: Memory Hub...');
  await page.click('button:has-text("Memory")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/smouj/apps/kanclaw/screenshots/05-memory.png', fullPage: true });
  
  await browser.close();
  console.log('All screenshots saved!');
})();
