import { test, expect } from './fixtures';

test('app configuration page should render', async ({ appConfigPage: _appConfigPage, page }) => {
  await expect(page.getByText('Monitored apps')).toBeVisible();
});

test('should show empty state when no apps are configured', async ({ appConfigPage: _appConfigPage, page }) => {
  await expect(page.getByText('No apps configured. Open the plugin to add one.')).toBeVisible();
});