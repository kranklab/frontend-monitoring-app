import { SceneAppPage } from '@grafana/scenes';
import { sessionsScene } from './sessionsScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES, FaroApp } from '../../constants';

export function createSessionsPage(apps: FaroApp[]) {
  return new SceneAppPage({
    title: 'Sessions',
    url: prefixRoute(ROUTES.Sessions),
    routePath: ROUTES.Sessions,
    subTitle: 'User sessions captured by the Faro SDK.',
    getScene: () => sessionsScene(apps),
  });
}
