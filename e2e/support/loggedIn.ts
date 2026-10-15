import { Page, expect } from '@playwright/test';

export async function expectLoggedIn(page: Page): Promise<void> {
  await expect(page.getByRole('link', { name: 'Liigu edasi sisu juurde' })).toBeAttached();
  await expect(page.getByRole('button', { name: 'Sisenen' })).toHaveCount(0);
}

export async function expectLoggedInOn(page: Page, pathname: string): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === pathname);
  await expectLoggedIn(page);
}
