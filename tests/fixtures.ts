import { AppConfigPage, AppPage, test as base } from '@grafana/plugin-e2e';
import pluginJson from '../src/plugin.json';

type AppTestFixture = {
  appConfigPage: AppConfigPage;
  gotoPage: (path?: string) => Promise<AppPage>;
  clearPluginApps: () => Promise<void>;
};

export const test = base.extend<AppTestFixture>({
  appConfigPage: async ({ gotoAppConfigPage }, use) => {
    const configPage = await gotoAppConfigPage({
      pluginId: pluginJson.id,
    });
    await use(configPage);
  },
  gotoPage: async ({ gotoAppPage }, use) => {
    await use((path) =>
      gotoAppPage({
        path,
        pluginId: pluginJson.id,
      })
    );
  },
  clearPluginApps: async ({ request }, use) => {
    await use(async () => {
      await request.post(`/api/plugins/${pluginJson.id}/settings`, {
        data: {
          enabled: true,
          pinned: true,
          jsonData: { apps: [] },
        },
      });
    });
  },
});

export { expect } from '@grafana/plugin-e2e';
