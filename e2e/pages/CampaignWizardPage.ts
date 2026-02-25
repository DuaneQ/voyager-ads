import { Page, Locator } from '@playwright/test';

// Page Object for the Campaign Wizard (high-level flows).
// NOTE: selectors are intentionally resilient; update them to match the app's DOM attributes (data-testid, aria-labels) if needed.
export class CampaignWizardPage {
  readonly page: Page;
  readonly placementSelect: Locator;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.placementSelect = page.locator('select[name="placement"]').first();
    this.nextButton = page.getByRole('button', { name: /next|continue/i }).first();
    this.backButton = page.getByRole('button', { name: /back/i }).first();
    this.submitButton = page.getByRole('button', { name: /create|submit|finish/i }).first();
  }

  async goto(baseUrl = process.env.BASE_URL || 'http://localhost:5173') {
    await this.page.goto(`${baseUrl}/create-campaign`);
    await this.page.waitForLoadState('networkidle');
  }

  async selectPlacement(name: string) {
    // Try a few strategies to cover common implementations
    if (await this.placementSelect.count()) {
      await this.placementSelect.selectOption({ label: name });
      return;
    }

    // fallback: click the visible label text for the placement (StepDetails uses a clickable Box)
    // scope the search to the StepDetails group to avoid matching similar text on other pages
    const stepGroup = this.page.getByRole('group', { name: /Step 1 of .*: Details/i }).first();
    if (await stepGroup.count()) {
      const byText = stepGroup.getByText(new RegExp(`^${name}$`, 'i')).first();
      if (await byText.count()) {
        await byText.click();
        return;
      }
    }
    // fallback to global text search if scoped search fails
    const byTextGlobal = this.page.getByText(new RegExp(`^${name}$`, 'i')).first();
    if (await byTextGlobal.count()) {
      await byTextGlobal.click();
      return;
    }

    const radio = this.page.getByLabel(new RegExp(name, 'i'));
    if (await radio.count()) {
      await radio.first().click();
      return;
    }

    throw new Error(`Placement selector for "${name}" not found; update selector in CampaignWizardPage`);
  }

  async next() {
    // Wait until a Next/Continue button becomes enabled, then click it.
    await this.page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
      const btn = buttons.find(b => /next|continue/i.test(b.textContent || ''))
      return !!btn && !btn.disabled
    }, {}, { timeout: 5000 })

    const btn = this.page.getByRole('button', { name: /next|continue/i }).first();
    await btn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async fillCampaignName(name: string) {
    const el = this.page.getByLabel('Campaign name').first();
    if (await el.count()) await el.fill(name);
  }

  async setStartDate(dateIso: string) {
    const el = this.page.getByLabel('Campaign start date').first();
    if (await el.count()) await el.fill(dateIso);
  }

  async selectObjective(label: string) {
    const select = this.page.getByLabel('Objective').first();
    if (await select.count()) {
      await select.click();
      // wait for menu options to appear
      await this.page.waitForSelector('li[role="option"], div[role="option"]', { timeout: 2000 }).catch(() => {})
      const option = this.page.getByRole('option', { name: new RegExp(label, 'i') }).first();
      if (await option.count()) await option.click();
    }
  }

  async fillBudgetAmount(amount: string) {
    const el = this.page.getByLabel('Budget amount (USD)').first();
    if (await el.count()) await el.fill(amount);
  }

  async agreePolicy() {
    const checkbox = this.page.getByRole('checkbox').first();
    if (await checkbox.count()) await checkbox.check();
  }

  async fillAudienceName(name: string) {
    const el = this.page.getByLabel('Audience name').first();
    if (await el.count()) await el.fill(name);
  }

  async back() {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async submit() {
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  // Minimal creative fill helpers; tests can extend as-needed.
  async fillCreativeHeadline(text: string) {
    const byLabel = this.page.getByLabel('Creative name').first();
    if (await byLabel.count()) {
      await byLabel.fill(text);
      return;
    }

    const headline = this.page.locator('input[name="headline"], textarea[name="headline"]').first();
    if (await headline.count()) await headline.fill(text);
  }

  async uploadCreativeImage(filePath: string) {
    const upload = this.page.locator('input[type="file"]').first();
    if (!await upload.count()) return;
    await upload.setInputFiles(filePath);
  }

  async fillCTA(ctaText: string) {
    const select = this.page.getByLabel('Call to action').first();
    if (await select.count()) {
      await select.click();
      const option = this.page.getByRole('option', { name: new RegExp(ctaText, 'i') }).first();
      if (await option.count()) await option.click();
      return;
    }

    const cta = this.page.locator('input[name="cta"]');
    if (await cta.count()) await cta.fill(ctaText);
  }

  async fillContactAddress(text: string) {
    const addr = this.page.getByLabel('Address').first();
    if (await addr.count()) {
      await addr.fill(text);
      return;
    }

    const fallback = this.page.locator('input[name="address"], textarea[name="address"]').first();
    if (await fallback.count()) await fallback.fill(text);
  }

  async openTargetingTab() {
    const tab = this.page.getByRole('tab', { name: /targeting|audience/i }).first();
    if (await tab.count()) await tab.click();
  }
}

export default CampaignWizardPage;
