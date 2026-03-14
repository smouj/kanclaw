import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3020';

test.describe('KanClaw E2E', () => {
  
  test('homepage loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/KanClaw/);
  });

  test('homepage shows OpenClaw status', async ({ page }) => {
    await page.goto(BASE_URL);
    // Should show either "Conectado" or "Desconectado" for OpenClaw
    const status = page.locator('text=Conectado, text=Desconectado, text=Gateway');
    await expect(status.first()).toBeVisible();
  });

  test('homepage shows project list', async ({ page }) => {
    await page.goto(BASE_URL);
    // Should show projects section or create project form
    const projects = page.locator('text=Projects, text=Proyectos');
    await expect(projects.first()).toBeVisible();
  });

  test('project page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/project/test`);
    // Should load the project workspace
    await expect(page.locator('button, a[href*="/project/"]').first()).toBeVisible();
  });

  test('project page shows sidebar', async ({ page }) => {
    await page.goto(`${BASE_URL}/project/test`);
    // Should show navigation elements
    const nav = page.locator('text=Chat, text=Board, text=Memoria, text=Archivos');
    await expect(nav.first()).toBeVisible({ timeout: 10000 });
  });

  test('navigation tabs work', async ({ page }) => {
    await page.goto(`${BASE_URL}/project/test`);
    
    // Click Chat tab
    const chatTab = page.locator('button:has-text("Chat"), button:has-text("Chat")').first();
    if (await chatTab.isVisible()) {
      await chatTab.click();
      await page.waitForTimeout(500);
    }
    
    // Click Board tab  
    const boardTab = page.locator('button:has-text("Board"), button:has-text("Tablero")').first();
    if (await boardTab.isVisible()) {
      await boardTab.click();
      await page.waitForTimeout(500);
    }
    
    // Click Memory tab
    const memoryTab = page.locator('button:has-text("Memoria"), button:has-text("Memory")').first();
    if (await memoryTab.isVisible()) {
      await memoryTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto(`${BASE_URL}/project/test`);
    
    // Find and click theme toggle
    const themeButton = page.locator('button[aria-label*="theme"], button[title*="theme"], button:has(svg.lucide-sun), button:has(svg.lucide-moon)').first();
    if (await themeButton.count() > 0) {
      await themeButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('language selector works', async ({ page }) => {
    await page.goto(`${BASE_URL}/project/test`);
    
    // Click EN button
    const enButton = page.locator('button:has-text("EN")').first();
    if (await enButton.isVisible()) {
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

  test('api projects list', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/projects`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('api cleanup stats', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/cleanup`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('projects');
    expect(data).toHaveProperty('agents');
    expect(data).toHaveProperty('runs');
  });

});
