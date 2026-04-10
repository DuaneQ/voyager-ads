import { test, expect } from '@playwright/test';
import CampaignWizardPage from '../pages/CampaignWizardPage';
import { selectGooglePlace } from '../helpers/googleAutocomplete';
import { signIn } from '../helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:5173';

test.describe('Campaign Wizard - placements', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure tests are authenticated — sign in via UI using provided test creds
    try {
      await signIn(page);
      console.log('E2E: signIn completed in beforeEach');
    } catch (err) {
      // capture page state and rethrow so Playwright records failure artifacts
      try { await page.screenshot({ path: `test-results/debug-signin-beforeEach-${Date.now()}.png`, fullPage: true }); } catch (e) {}
      throw err;
    }
  });

  test('Create Video Feed campaign flow', async ({ page }) => {
    const wizard = new CampaignWizardPage(page);
    await wizard.goto(BASE);
    // Fill step 0 (Details)
    await wizard.fillCampaignName('Video campaign e2e test');
    const today = new Date().toISOString().slice(0, 10);
    await wizard.setStartDate(today);
    await wizard.selectObjective('Awareness');

    // Select placement on Details step, then go to Creative
    await wizard.selectPlacement('Video Feed');
    await wizard.next(); // to Creative
    await wizard.fillCreativeHeadline('Video campaign e2e test');
    await wizard.fillLandingUrl('https://example.com');
    await wizard.fillCTA('Book Now');
    await wizard.next(); // to Targeting

    // Targeting: fill audience name then select location
    await wizard.openTargetingTab();
    await wizard.fillAudienceName('San Francisco audience');
    await selectGooglePlace(page, 'label:Location', 'San Francisco');

    // Move to Budget, fill amount, then Review and agree policy
    await wizard.next(); // to Budget
    await wizard.fillBudgetAmount('100');
    await wizard.next(); // to Review
    await wizard.agreePolicy();
    await wizard.submit();

    // Wizard now redirects to campaign billing after submit.
    await page.waitForURL(/\/billing\//, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /campaign billing/i })).toBeVisible();
  });

  test('Create Itinerary Feed campaign flow', async ({ page }) => {
    const wizard = new CampaignWizardPage(page);
    await wizard.goto(BASE);
    await wizard.fillCampaignName('Itinerary campaign e2e test');
    const today2 = new Date().toISOString().slice(0, 10);
    await wizard.setStartDate(today2);
    await wizard.selectObjective('Traffic');

    // Select placement on Details step, then go to Creative
    await wizard.selectPlacement('Itinerary Feed');
    await wizard.next(); // to Creative
    await wizard.fillCreativeHeadline('Itinerary campaign e2e test');
    await wizard.fillLandingUrl('https://example.com');
    await wizard.fillCTA('Learn more');
    await wizard.next(); // to Targeting

    await wizard.openTargetingTab();
    await wizard.fillAudienceName('NY audience');
    await selectGooglePlace(page, 'label:Target destination', 'New York');

    // add a simple audience preference if present
    const tripType = page.getByRole('button', { name: /Leisure|Business|Adventure/i }).first();
    if (await tripType.count()) await tripType.click();

    await wizard.next(); // to Budget
    await wizard.fillBudgetAmount('50');
    await wizard.next(); // to Review
    await wizard.agreePolicy();
    await wizard.submit();

    // Wizard now redirects to campaign billing after submit.
    await page.waitForURL(/\/billing\//, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /campaign billing/i })).toBeVisible();
  });

  test('Create AI Slot campaign flow', async ({ page }) => {
    const wizard = new CampaignWizardPage(page);
    await wizard.goto(BASE);
    await wizard.fillCampaignName('AI slot campaign e2e test');
    const today3 = new Date().toISOString().slice(0, 10);
    await wizard.setStartDate(today3);
    await wizard.selectObjective('Awareness');

    // Select placement on Details step, then go to Creative
    await wizard.selectPlacement('AI Slots');
    await wizard.next(); // to Creative
    await wizard.fillCreativeHeadline('AI slot campaign e2e test');
    await wizard.fillLandingUrl('https://example.com');
    await wizard.fillContactAddress('123 Example St');
    await wizard.fillCTA('Learn More');
    await wizard.next(); // to Targeting

    await wizard.openTargetingTab();
    await wizard.fillAudienceName('LA audience');
    await selectGooglePlace(page, 'label:Location', 'Los Angeles');

    // toggle a preference chip if present
    const chip = page.getByRole('button', { name: /Romantic|Adventure|Family/i }).first();
    if (await chip.count()) await chip.click();

    await wizard.next(); // to Budget
    await wizard.fillBudgetAmount('75');
    await wizard.next(); // to Review
    await wizard.agreePolicy();
    await wizard.submit();

    // Wizard now redirects to campaign billing after submit.
    await page.waitForURL(/\/billing\//, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /campaign billing/i })).toBeVisible();
  });
});
