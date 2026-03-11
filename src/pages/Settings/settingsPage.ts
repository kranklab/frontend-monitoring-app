import { EmbeddedScene, SceneAppPage, SceneReactObject } from '@grafana/scenes';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { SettingsPage } from './SettingsPage';

export function createSettingsPage() {
  return new SceneAppPage({
    title: 'Settings',
    url: prefixRoute(ROUTES.Settings),
    routePath: ROUTES.Settings,
    getScene: () =>
      new EmbeddedScene({
        body: new SceneReactObject({ component: SettingsPage }),
      }),
  });
}
