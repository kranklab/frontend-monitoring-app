import { SceneAppPage } from '@grafana/scenes';
import { overviewScene } from './overviewScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES, FaroApp } from '../../constants';

export function createOverviewPage(apps: FaroApp[]) {
  return new SceneAppPage({
    title: 'Overview',
    url: prefixRoute(ROUTES.Overview),
    routePath: ROUTES.Overview,
    subTitle: 'Real User Monitoring overview from Grafana Faro SDK data.',
    getScene: () => overviewScene(apps),
  });
}