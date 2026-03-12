import { SceneAppPage } from '@grafana/scenes';
import { errorsScene } from './errorsScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES, FaroApp } from '../../constants';

export function createErrorsPage(app: FaroApp) {
  return new SceneAppPage({
    title: 'Errors',
    url: prefixRoute(ROUTES.Errors),
    routePath: ROUTES.Errors,
    subTitle: 'JavaScript exceptions and errors captured by the Faro SDK.',
    getScene: () => errorsScene(app),
  });
}
