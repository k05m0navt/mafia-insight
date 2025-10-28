import { test as base, expect } from '@playwright/test';

export interface AuthFixtures {
  loginAsAdmin: () => Promise<void>;
  loginAsUser: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

export const test = base.extend<AuthFixtures>({
  loginAsAdmin: async ({ page }, use) => {
    await use(async () => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'admin@example.com');
      await page.fill('[data-testid="password"]', 'admin123');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="user-role"]')).toContainText(
        'admin'
      );
    });
  },

  loginAsUser: async ({ page }, use) => {
    await use(async () => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'user@example.com');
      await page.fill('[data-testid="password"]', 'user123');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="user-role"]')).toContainText(
        'user'
      );
    });
  },

  loginAsGuest: async ({ page }, use) => {
    await use(async () => {
      await page.goto('/');
      await expect(page.locator('[data-testid="user-role"]')).toContainText(
        'guest'
      );
    });
  },

  logout: async ({ page }, use) => {
    await use(async () => {
      await page.click('[data-testid="logout-button"]');
      await expect(page).toHaveURL('/login');
      await expect(page.locator('[data-testid="user-role"]')).toContainText(
        'guest'
      );
    });
  },
});

export { expect } from '@playwright/test';
