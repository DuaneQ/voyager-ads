/**
 * Simple auth helper for Playwright tests that signs in via the UI using
 * FEEDBACK_EMAIL and FEEDBACK_PASSWORD environment variables.
 */
export async function signIn(page) {
  const base = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:5173';
  const email = process.env.FEEDBACK_EMAIL;
  const password = process.env.FEEDBACK_PASSWORD;
  if (!email || !password) throw new Error('FEEDBACK_EMAIL and FEEDBACK_PASSWORD must be set');

  try {
    console.log('E2E: navigating to sign-in page', `${base}/signin`);
    // Set bypass localStorage so app auto-signs in (dev-only). This avoids fragile IndexedDB/state issues.
    await page.addInitScript((e) => {
      try {
        localStorage.setItem('PLAYWRIGHT_BYPASS_AUTH', '1')
        localStorage.setItem('PLAYWRIGHT_BYPASS_EMAIL', e.email)
        localStorage.setItem('PLAYWRIGHT_BYPASS_PASSWORD', e.password)
      } catch (err) {
        // noop
      }
    }, { email, password })

    await page.goto(`${base}/`, { waitUntil: 'networkidle' });

    const emailEl = page.getByLabel('Email address').first();
    const passEl = page.getByLabel('Password').first();
    console.log('E2E: locating email/password inputs');
    if (await emailEl.count()) {
      await emailEl.fill(email);
      console.log('E2E: filled email');
    } else {
      console.log('E2E: email input not found');
    }
    if (await passEl.count()) {
      await passEl.fill(password);
      console.log('E2E: filled password');
    } else {
      console.log('E2E: password input not found');
    }

    const signInBtn = page.getByRole('button', { name: /sign in/i }).first();
    if (await signInBtn.count()) {
      console.log('E2E: clicking Sign in button');
      await signInBtn.click();
    } else {
      console.log('E2E: Sign in button not found — relying on auto-login');
    }

    // wait for navigation away from sign-in (or for the auto-login to complete)
    await page.waitForSelector('h1:has-text("Sign in"), h2:has-text("Sign in")', { state: 'detached', timeout: 10000 });
    console.log('E2E: sign-in appears successful (signin heading detached)');
  } catch (err) {
    const out = `e2e/.auth/debug-signin-${Date.now()}`;
    try { await page.screenshot({ path: `${out}.png`, fullPage: true }); } catch (e) {}
    try { const html = await page.content(); require('fs').writeFileSync(`${out}.html`, html); } catch (e) {}
    console.error('E2E: sign-in failed — saved debug artifacts at', out);
    throw err;
  }
}
