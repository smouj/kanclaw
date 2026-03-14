import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3020';

test.describe('KanClaw E2E', () => {
  
  test('homepage loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/KanClaw/);
  });

  test('project page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/project/rpgclaw`);
    await expect(page.locator('h1')).toContainText(/RPG/i);
  });

  test('navigation tabs work', async ({ page }) => {
    await page.goto(`${BASE_URL}/project/rpgclaw`);
    
    // Click Chat tab
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(500);
    
    // Click Board tab  
    await page.click('button:has-text("Board")');
    await page.waitForTimeout(500);
    
    // Click Memory tab
    await page.click('button:has-text("Memoria")');
    await page.waitForTimeout(500);
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto(`${BASE_URL}/project/rpgclaw`);
    
    // Find and click theme toggle
    const themeButton = page.locator('button[aria-label*="theme"], button[title*="theme"], button:has(svg.lucide-sun), button:has(svg.lucide-moon)').first();
    if (await themeButton.count() > 0) {
      await themeButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('language selector works', async ({ page }) => {
    await page.goto(`${BASE_URL}/project/rpgclaw`);
    
    // Click EN button
    const enButton = page.locator('button:has-text("EN")').first();
    if (await enButton.count() > 0) {
      await enButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('api health check', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.app).toBe('kanclaw');
  });

});
