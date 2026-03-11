import {
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneTimeRange,
} from '@grafana/scenes';
import { createFaroControls, createTraceVariableSet, TEMPO_DS_REF } from '../../utils/utils.faro';
import { FaroApp } from '../../constants';

export function tracesScene(apps: FaroApp[]) {
  const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });

  const tracesData = new SceneQueryRunner({
    datasource: TEMPO_DS_REF,
    queries: [
      {
        refId: 'A',
        queryType: 'traceql',
        query: '{resource.service.name=~".*$service_name.*"}',
        limit: 50,
      },
    ],
  });

  const errorTracesData = new SceneQueryRunner({
    datasource: TEMPO_DS_REF,
    queries: [
      {
        refId: 'A',
        queryType: 'traceql',
        query: '{resource.service.name=~".*$service_name.*" && status=error}',
        limit: 20,
      },
    ],
  });

  return new EmbeddedScene({
    $timeRange: timeRange,
    $variables: createTraceVariableSet(apps),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: 400,
          body: PanelBuilders.table().setTitle('Recent Traces').setData(tracesData).build(),
        }),
        new SceneFlexItem({
          minHeight: 300,
          body: PanelBuilders.table().setTitle('Error Traces').setData(errorTracesData).build(),
        }),
      ],
    }),
    controls: createFaroControls(),
  });
}
