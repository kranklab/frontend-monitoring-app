import { test, expect } from './fixtures';

test.describe('navigating app', () => {
  test.beforeEach(async ({ clearPluginApps }) => {
    await clearPluginApps();
  });

  test('app root should render successfully', async ({ gotoPage, page }) => {
    await gotoPage('');
    await expect(page.getByText('Frontend Monitoring')).toBeVisible();
  });

  test('app should show add app prompt when no apps are configured', async ({ gotoPage, page }) => {
    await gotoPage('');
    await expect(
      page.getByText('Add your Faro-instrumented app to start seeing real user monitoring data.')
    ).toBeVisible();
  });

  test('app should show the add app form fields', async ({ gotoPage, page }) => {
    await gotoPage('');
    await expect(page.getByRole('textbox', { name: /App URL/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Service name/i })).toBeVisible();
  });

  test('app should show the add app submit button', async ({ gotoPage, page }) => {
    await gotoPage('');
    await expect(page.getByRole('button', { name: /Add app/i })).toBeVisible();
  });
});