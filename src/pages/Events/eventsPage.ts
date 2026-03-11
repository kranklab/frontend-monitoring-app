import { SceneAppPage } from '@grafana/scenes';
import { eventsScene } from './eventsScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES, FaroApp } from '../../constants';

export function createEventsPage(apps: FaroApp[]) {
  return new SceneAppPage({
    title: 'Events',
    url: prefixRoute(ROUTES.Events),
    routePath: ROUTES.Events,
    subTitle: 'Page views, navigation events and user interactions captured by the Faro SDK.',
    getScene: () => eventsScene(apps),
  });
}