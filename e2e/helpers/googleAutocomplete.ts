import { Page } from '@playwright/test';

/**
 * Helper to interact with Google Places / autocomplete style inputs.
 * Strategy:
 *  - Fill the input
 *  - Wait for a suggestions container to appear (several common containers are supported)
 *  - Select the first visible suggestion (ArrowDown+Enter fallback)
 *
 * Note: Adjust selectors if the project uses a custom dropdown implementation.
 */
export async function selectGooglePlace(page: Page, inputSelector: string, value: string) {
  // inputSelector supports either a CSS selector or a 'label:Label Text' pseudo-selector
  let inputLocator = null as any
  if (inputSelector.startsWith('label:')) {
    const label = inputSelector.replace(/^label:/, '')
    inputLocator = page.getByLabel(label).first()
  } else {
    inputLocator = page.locator(inputSelector).first()
  }

  let input = inputLocator
  if (!await input.count()) {
    // fallback: common placeholder used by DestinationAutocomplete
    input = page.getByPlaceholder('e.g. Paris, Tokyo, New York').first()
  }
  if (!await input.count()) {
    // final fallback: use the first visible text input on the page
    input = page.locator('input[type="text"], input[type="search"], input[type="search"]').first()
  }

  await input.fill('');
  await input.type(value, { delay: 50 });

  // Common suggestion containers used by Places and other autocomplete widgets
  const suggestionSelectors = [
    '.pac-container', // Google Places
    '[role="listbox"]', // ARIA listbox
    '.MuiAutocomplete-popper', // MUI Autocomplete
    '.autocomplete-dropdown',
  ];

  let dropdownFound = false;
  for (const sel of suggestionSelectors) {
    const el = page.locator(sel).first();
    try {
      await el.waitFor({ state: 'visible', timeout: 2000 });
      // click first item if present
      const firstItem = el.locator('li, div').filter({ hasText: /./ }).first();
      if (await firstItem.count()) {
        await firstItem.click();
        dropdownFound = true;
        break;
      }
    } catch (e) {
      // ignore and try next selector
    }
  }

  if (!dropdownFound) {
    // fallback: key navigation
    await input.press('ArrowDown');
    await input.press('Enter');
  }
}

export default selectGooglePlace;
