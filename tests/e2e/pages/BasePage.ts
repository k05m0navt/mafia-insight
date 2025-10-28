import { Page, expect } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common navigation methods
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  // Common element interaction methods
  async clickElement(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  async getText(selector: string): Promise<string> {
    return (await this.page.textContent(selector)) || '';
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  async isHidden(selector: string): Promise<boolean> {
    return await this.page.isHidden(selector);
  }

  // Common assertion methods
  async expectElementToBeVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectElementToBeHidden(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async expectElementToContainText(
    selector: string,
    text: string
  ): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async expectElementToHaveValue(
    selector: string,
    value: string
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveValue(value);
  }

  async expectUrlToContain(urlPart: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(urlPart));
  }

  // Common wait methods
  async waitForElement(
    selector: string,
    timeout: number = 5000
  ): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForFunction(
      (text) => document.body.textContent?.includes(text),
      text,
      { timeout }
    );
  }

  // Common form methods
  async submitForm(formSelector: string = 'form'): Promise<void> {
    await this.page.click(`${formSelector} [type="submit"]`);
  }

  async clearInput(selector: string): Promise<void> {
    await this.page.fill(selector, '');
  }

  // Common navigation methods
  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  // Common screenshot methods
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }

  // Common error handling methods
  async expectErrorMessage(message: string): Promise<void> {
    await this.expectElementToContainText(
      '[data-testid="error-message"]',
      message
    );
  }

  async expectSuccessMessage(message: string): Promise<void> {
    await this.expectElementToContainText(
      '[data-testid="success-message"]',
      message
    );
  }

  // Common loading state methods
  async waitForLoadingToComplete(): Promise<void> {
    await this.page.waitForFunction(
      () => !document.querySelector('[data-testid="loading"]')
    );
  }

  async expectLoadingToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible('[data-testid="loading"]');
  }

  async expectLoadingToBeHidden(): Promise<void> {
    await this.expectElementToBeHidden('[data-testid="loading"]');
  }
}
