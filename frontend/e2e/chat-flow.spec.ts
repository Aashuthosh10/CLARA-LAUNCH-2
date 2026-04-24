import { test, expect } from '@playwright/test';

test.describe('CLARA chat flow', () => {
  test('Sleep -> Language -> Chat (no menu) shows greeting and orb', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // 1. Sleep screen visible, tap to wake
    await expect(page.getByTestId('sleep-screen')).toBeVisible();
    await page.getByTestId('sleep-screen').click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(1200);

    // 2. Language select (state 3)
    await expect(page.getByTestId('language-english')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('language-english').click();
    await page.waitForTimeout(1500);

    // 3. Chat screen directly (no menu): CLARA header, greeting, orb
    await expect(page.getByTestId('chat-screen')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'CLARA' })).toBeVisible();
    await expect(
      page.getByText(/Good evening|I am CLARA|How may I help you today?/i)
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Voice input|Tap to speak/i })).toBeVisible();
  });

  test('URL ?state=5 shows chat screen with greeting and orb', async ({ page }) => {
    await page.goto('http://localhost:5173/?state=5', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await expect(page.getByTestId('chat-screen')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'CLARA' })).toBeVisible();
    await expect(
      page.getByText(/Good evening|I am CLARA|How may I help you today?/i)
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Voice input|Tap to speak/i })).toBeVisible();
    await page.screenshot({ path: 'test-results/chat-screen-verified.png', fullPage: true });
  });

  test('Debug key 3 then 5: language then chat', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('sleep-screen')).toBeVisible();

    const sendKey = (key: string) =>
      page.evaluate((k) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      }, key);
    await sendKey('3');
    await page.waitForTimeout(600);
    await sendKey('5');
    await page.waitForTimeout(1200);

    await expect(page.getByTestId('chat-screen')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'CLARA' })).toBeVisible();
    await expect(
      page.getByText(/Good evening|I am CLARA|How may I help you today?/i)
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Voice input|Tap to speak/i })).toBeVisible();
  });
});
