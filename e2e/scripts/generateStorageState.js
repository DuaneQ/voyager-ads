const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const email = process.env.FEEDBACK_EMAIL;
  const password = process.env.FEEDBACK_PASSWORD;
  const base = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:5173';

  if (!email || !password) {
    console.error('FEEDBACK_EMAIL and FEEDBACK_PASSWORD must be set');
    process.exit(2);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${base}/signin`, { waitUntil: 'networkidle' });

    // Fill email/password using accessible labels observed in the sign-in page
    const emailEl = page.getByLabel('Email address').first();
    const passEl = page.getByLabel('Password').first();
    if (await emailEl.count()) await emailEl.fill(email);
    if (await passEl.count()) await passEl.fill(password);

    const signInBtn = page.getByRole('button', { name: /sign in/i }).first();
    if (await signInBtn.count()) await signInBtn.click();

    // wait for something that indicates we're signed in — try the 'Get started' link
    await page.waitForSelector('a[href="/create-campaign"], a:has-text("Get started")', { timeout: 10000 });

    // Save storage state for reuse by tests
    const outDir = './e2e/.auth';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const path = `${outDir}/storageState.json`;
    await context.storageState({ path });
    console.log('Saved storageState to', path);
  } catch (err) {
    console.error('Failed to generate storage state:', err);
    process.exit(3);
  } finally {
    await browser.close();
  }

  process.exit(0);
})();
