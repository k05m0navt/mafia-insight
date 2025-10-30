import { Page, expect } from '@playwright/test';
import { testLogger } from '../logging/TestLogger';

export interface UserCredentials {
  email: string;
  password: string;
  role?: string;
  name?: string;
}

export interface AuthTestConfig {
  baseUrl: string;
  testUsers: {
    admin: UserCredentials;
    user: UserCredentials;
    guest: UserCredentials;
  };
  timeout: number;
  retries: number;
}

export class AuthTestUtils {
  private config: AuthTestConfig;

  constructor(config: AuthTestConfig) {
    this.config = config;
  }

  async navigateToLogin(page: Page): Promise<void> {
    await page.goto(`${this.config.baseUrl}/login`);
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    testLogger.info('Navigated to login page', { url: page.url() });
  }

  async navigateToSignup(page: Page): Promise<void> {
    await page.goto(`${this.config.baseUrl}/signup`);
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible();
    testLogger.info('Navigated to signup page', { url: page.url() });
  }

  async navigateToDashboard(page: Page): Promise<void> {
    await page.goto(`${this.config.baseUrl}/dashboard`);
    testLogger.info('Navigated to dashboard', { url: page.url() });
  }

  async fillLoginForm(page: Page, credentials: UserCredentials): Promise<void> {
    await page.fill('[data-testid="email-input"]', credentials.email);
    await page.fill('[data-testid="password-input"]', credentials.password);
    testLogger.info('Filled login form', { email: credentials.email });
  }

  async fillSignupForm(
    page: Page,
    userData: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }
  ): Promise<void> {
    await page.fill('[data-testid="name-input"]', userData.name);
    await page.fill('[data-testid="email-input"]', userData.email);
    await page.fill('[data-testid="password-input"]', userData.password);
    await page.fill(
      '[data-testid="confirm-password-input"]',
      userData.confirmPassword
    );
    testLogger.info('Filled signup form', {
      email: userData.email,
      name: userData.name,
    });
  }

  async submitLoginForm(page: Page): Promise<void> {
    await page.click('[data-testid="login-button"]');
    testLogger.info('Submitted login form');
  }

  async submitSignupForm(page: Page): Promise<void> {
    await page.click('[data-testid="signup-button"]');
    testLogger.info('Submitted signup form');
  }

  async waitForLoginSuccess(page: Page): Promise<void> {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    testLogger.info('Login successful', { url: page.url() });
  }

  async waitForSignupSuccess(page: Page): Promise<void> {
    await expect(page).toHaveURL(/\/dashboard|\/login/);
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    testLogger.info('Signup successful', { url: page.url() });
  }

  async waitForLoginError(page: Page, expectedError?: string): Promise<void> {
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    if (expectedError) {
      await expect(page.locator('[data-testid="login-error"]')).toContainText(
        expectedError
      );
    }
    testLogger.info('Login error displayed', { expectedError });
  }

  async waitForSignupError(page: Page, expectedError?: string): Promise<void> {
    await expect(page.locator('[data-testid="signup-error"]')).toBeVisible();
    if (expectedError) {
      await expect(page.locator('[data-testid="signup-error"]')).toContainText(
        expectedError
      );
    }
    testLogger.info('Signup error displayed', { expectedError });
  }

  async waitForValidationError(
    page: Page,
    field: string,
    expectedError?: string
  ): Promise<void> {
    const errorSelector = `[data-testid="${field}-error"]`;
    await expect(page.locator(errorSelector)).toBeVisible();
    if (expectedError) {
      await expect(page.locator(errorSelector)).toContainText(expectedError);
    }
    testLogger.info('Validation error displayed', { field, expectedError });
  }

  async performLogin(page: Page, credentials: UserCredentials): Promise<void> {
    await this.navigateToLogin(page);
    await this.fillLoginForm(page, credentials);
    await this.submitLoginForm(page);
    await this.waitForLoginSuccess(page);
  }

  async performSignup(
    page: Page,
    userData: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }
  ): Promise<void> {
    await this.navigateToSignup(page);
    await this.fillSignupForm(page, userData);
    await this.submitSignupForm(page);
    await this.waitForSignupSuccess(page);
  }

  async performLogout(page: Page): Promise<void> {
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');
    await expect(page).toHaveURL(/\/login/);
    testLogger.info('Logout successful', { url: page.url() });
  }

  async performLogoutWithConfirmation(page: Page): Promise<void> {
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');

    // Wait for confirmation dialog
    await expect(
      page.locator('[data-testid="logout-confirmation-dialog"]')
    ).toBeVisible();
    await page.click('[data-testid="logout-confirm-button"]');

    await expect(page).toHaveURL(/\/login/);
    testLogger.info('Logout with confirmation successful', { url: page.url() });
  }

  async checkUserRole(page: Page, expectedRole: string): Promise<void> {
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      expectedRole
    );
    testLogger.info('User role verified', { expectedRole });
  }

  async checkAdminNavigationVisible(page: Page): Promise<void> {
    await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="user-management-link"]')
    ).toBeVisible();
    testLogger.info('Admin navigation is visible');
  }

  async checkAdminNavigationHidden(page: Page): Promise<void> {
    await expect(page.locator('[data-testid="admin-menu"]')).not.toBeVisible();
    await expect(
      page.locator('[data-testid="user-management-link"]')
    ).not.toBeVisible();
    testLogger.info('Admin navigation is hidden');
  }

  async checkUnauthorizedAccess(
    page: Page,
    expectedUrl?: string
  ): Promise<void> {
    if (expectedUrl) {
      await expect(page).toHaveURL(expectedUrl);
    } else {
      await expect(page).toHaveURL(/\/unauthorized/);
    }
    await expect(
      page.locator('[data-testid="unauthorized-message"]')
    ).toBeVisible();
    testLogger.info('Unauthorized access detected', { url: page.url() });
  }

  async checkLoadingState(page: Page, element: string): Promise<void> {
    await expect(page.locator(`[data-testid="${element}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${element}"]`)).toBeDisabled();
    testLogger.info('Loading state verified', { element });
  }

  async checkFormValidation(
    page: Page,
    field: string,
    value: string,
    expectedError: string
  ): Promise<void> {
    await page.fill(`[data-testid="${field}-input"]`, value);
    await page.click('[data-testid="login-button"]');
    await this.waitForValidationError(page, field, expectedError);
  }

  async clearForm(page: Page, formType: 'login' | 'signup'): Promise<void> {
    if (formType === 'login') {
      await page.fill('[data-testid="email-input"]', '');
      await page.fill('[data-testid="password-input"]', '');
    } else {
      await page.fill('[data-testid="name-input"]', '');
      await page.fill('[data-testid="email-input"]', '');
      await page.fill('[data-testid="password-input"]', '');
      await page.fill('[data-testid="confirm-password-input"]', '');
    }
    testLogger.info('Form cleared', { formType });
  }

  async waitForPageLoad(page: Page, expectedUrl?: string): Promise<void> {
    if (expectedUrl) {
      await expect(page).toHaveURL(expectedUrl);
    }
    await page.waitForLoadState('networkidle');
    testLogger.info('Page loaded', { url: page.url() });
  }

  async takeScreenshot(page: Page, name: string): Promise<void> {
    await page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
    });
    testLogger.info('Screenshot taken', { name });
  }

  async waitForElement(
    page: Page,
    selector: string,
    timeout: number = 5000
  ): Promise<void> {
    await page.waitForSelector(selector, { timeout });
    testLogger.info('Element found', { selector });
  }

  async waitForElementToDisappear(
    page: Page,
    selector: string,
    timeout: number = 5000
  ): Promise<void> {
    await page.waitForSelector(selector, { state: 'hidden', timeout });
    testLogger.info('Element disappeared', { selector });
  }

  async checkElementVisible(page: Page, selector: string): Promise<boolean> {
    try {
      await expect(page.locator(selector)).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  async checkElementText(
    page: Page,
    selector: string,
    expectedText: string
  ): Promise<boolean> {
    try {
      await expect(page.locator(selector)).toContainText(expectedText);
      return true;
    } catch {
      return false;
    }
  }

  async getElementText(page: Page, selector: string): Promise<string> {
    const element = page.locator(selector);
    return (await element.textContent()) || '';
  }

  async getElementAttribute(
    page: Page,
    selector: string,
    attribute: string
  ): Promise<string | null> {
    const element = page.locator(selector);
    return await element.getAttribute(attribute);
  }

  async isElementEnabled(page: Page, selector: string): Promise<boolean> {
    const element = page.locator(selector);
    return await element.isEnabled();
  }

  async isElementDisabled(page: Page, selector: string): Promise<boolean> {
    const element = page.locator(selector);
    return await element.isDisabled();
  }

  async clickElement(page: Page, selector: string): Promise<void> {
    await page.click(selector);
    testLogger.info('Element clicked', { selector });
  }

  async fillElement(
    page: Page,
    selector: string,
    value: string
  ): Promise<void> {
    await page.fill(selector, value);
    testLogger.info('Element filled', { selector, value });
  }

  async selectOption(
    page: Page,
    selector: string,
    value: string
  ): Promise<void> {
    await page.selectOption(selector, value);
    testLogger.info('Option selected', { selector, value });
  }

  async checkCheckbox(page: Page, selector: string): Promise<void> {
    await page.check(selector);
    testLogger.info('Checkbox checked', { selector });
  }

  async uncheckCheckbox(page: Page, selector: string): Promise<void> {
    await page.uncheck(selector);
    testLogger.info('Checkbox unchecked', { selector });
  }

  async hoverElement(page: Page, selector: string): Promise<void> {
    await page.hover(selector);
    testLogger.info('Element hovered', { selector });
  }

  async doubleClickElement(page: Page, selector: string): Promise<void> {
    await page.dblclick(selector);
    testLogger.info('Element double-clicked', { selector });
  }

  async rightClickElement(page: Page, selector: string): Promise<void> {
    await page.click(selector, { button: 'right' });
    testLogger.info('Element right-clicked', { selector });
  }

  async pressKey(page: Page, key: string): Promise<void> {
    await page.keyboard.press(key);
    testLogger.info('Key pressed', { key });
  }

  async typeText(page: Page, text: string): Promise<void> {
    await page.keyboard.type(text);
    testLogger.info('Text typed', { text });
  }

  async waitForTimeout(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
    testLogger.info('Timeout waited', { ms });
  }

  async waitForNetworkIdle(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
    testLogger.info('Network idle state reached');
  }

  async waitForResponse(page: Page, url: string): Promise<void> {
    await page.waitForResponse((response) => response.url().includes(url));
    testLogger.info('Response received', { url });
  }

  async waitForRequest(page: Page, url: string): Promise<void> {
    await page.waitForRequest((request) => request.url().includes(url));
    testLogger.info('Request sent', { url });
  }

  async mockApiResponse(
    page: Page,
    url: string,
    response: unknown
  ): Promise<void> {
    await page.route(url, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
    testLogger.info('API response mocked', { url });
  }

  async mockApiError(
    page: Page,
    url: string,
    status: number = 500
  ): Promise<void> {
    await page.route(url, (route) => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Mocked error' }),
      });
    });
    testLogger.info('API error mocked', { url, status });
  }

  async clearMocks(page: Page): Promise<void> {
    await page.unrouteAll();
    testLogger.info('All mocks cleared');
  }

  async getCurrentUrl(page: Page): Promise<string> {
    return page.url();
  }

  async getPageTitle(page: Page): Promise<string> {
    return await page.title();
  }

  async getPageContent(page: Page): Promise<string> {
    return await page.content();
  }

  async getElementCount(page: Page, selector: string): Promise<number> {
    return await page.locator(selector).count();
  }

  async getElementBoundingBox(
    page: Page,
    selector: string
  ): Promise<{ x: number; y: number; width: number; height: number } | null> {
    return await page.locator(selector).boundingBox();
  }

  async scrollToElement(page: Page, selector: string): Promise<void> {
    await page.locator(selector).scrollIntoViewIfNeeded();
    testLogger.info('Scrolled to element', { selector });
  }

  async scrollToTop(page: Page): Promise<void> {
    await page.evaluate(() => window.scrollTo(0, 0));
    testLogger.info('Scrolled to top');
  }

  async scrollToBottom(page: Page): Promise<void> {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    testLogger.info('Scrolled to bottom');
  }

  async scrollBy(page: Page, x: number, y: number): Promise<void> {
    await page.evaluate(({ x, y }) => window.scrollBy(x, y), { x, y });
    testLogger.info('Scrolled by', { x, y });
  }

  async getViewportSize(
    page: Page
  ): Promise<{ width: number; height: number }> {
    return (await page.viewportSize()) || { width: 0, height: 0 };
  }

  async setViewportSize(
    page: Page,
    width: number,
    height: number
  ): Promise<void> {
    await page.setViewportSize({ width, height });
    testLogger.info('Viewport size set', { width, height });
  }

  async getCookies(
    page: Page
  ): Promise<
    {
      name: string;
      value: string;
      domain?: string;
      path?: string;
      expires?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    }[]
  > {
    return await page.context().cookies();
  }

  async setCookie(
    page: Page,
    name: string,
    value: string,
    domain?: string
  ): Promise<void> {
    await page.context().addCookies([
      {
        name,
        value,
        domain: domain || new URL(this.config.baseUrl).hostname,
        path: '/',
      },
    ]);
    testLogger.info('Cookie set', { name, value, domain });
  }

  async clearCookies(page: Page): Promise<void> {
    await page.context().clearCookies();
    testLogger.info('Cookies cleared');
  }

  async getLocalStorage(page: Page, key: string): Promise<string | null> {
    return await page.evaluate((key) => localStorage.getItem(key), key);
  }

  async setLocalStorage(page: Page, key: string, value: string): Promise<void> {
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key,
      value,
    });
    testLogger.info('Local storage set', { key, value });
  }

  async clearLocalStorage(page: Page): Promise<void> {
    await page.evaluate(() => localStorage.clear());
    testLogger.info('Local storage cleared');
  }

  async getSessionStorage(page: Page, key: string): Promise<string | null> {
    return await page.evaluate((key) => sessionStorage.getItem(key), key);
  }

  async setSessionStorage(
    page: Page,
    key: string,
    value: string
  ): Promise<void> {
    await page.evaluate(
      ({ key, value }) => sessionStorage.setItem(key, value),
      { key, value }
    );
    testLogger.info('Session storage set', { key, value });
  }

  async clearSessionStorage(page: Page): Promise<void> {
    await page.evaluate(() => sessionStorage.clear());
    testLogger.info('Session storage cleared');
  }
}
