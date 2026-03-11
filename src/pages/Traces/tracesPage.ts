import { EmbeddedScene, SceneAppPage, SceneReactObject } from '@grafana/scenes';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { TracesPage } from './TracesPage';

export function createTracesPage() {
  return new SceneAppPage({
    title: 'Traces',
    url: prefixRoute(ROUTES.Traces),
    routePath: ROUTES.Traces,
    subTitle: 'Distributed traces from the Faro SDK via OpenTelemetry.',
    getScene: () =>
      new EmbeddedScene({
        body: new SceneReactObject({ component: TracesPage }),
      }),
  });
}
