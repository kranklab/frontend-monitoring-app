import {
  EmbeddedScene,
  PanelBuilders,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
} from '@grafana/scenes';
import {
  createFaroControls,
  createFaroVariableSet,
  FARO_DS_REF,
  FARO_STREAM,
  FARO_URL_FILTER,
} from '../../utils/utils.faro';
import { FaroApp } from '../../constants';

export function eventsScene(apps: FaroApp[]) {

  const eventsOverTimeData = new SceneQueryRunner({
    datasource: FARO_DS_REF,
    queries: [
      {
        refId: 'A',
        expr: `sum by (event_name) (count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "event" [$__auto]))`,
        instant: false,
        range: true,
        legendFormat: '{{event_name}}',
      },
    ],
  });

  const topPagesData = new SceneDataTransformer({
    $data: new SceneQueryRunner({
      datasource: FARO_DS_REF,
      queries: [
        {
          refId: 'A',
          expr: `topk(10, sum by (page_url) (count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "event" [$__range])))`,
          instant: true,
          range: false,
          legendFormat: '{{page_url}}',
        },
      ],
    }),
    transformations: [
      { id: 'labelsToFields', options: { mode: 'columns' } },
      { id: 'merge', options: {} },
      {
        id: 'organize',
        options: {
          excludeByName: { Time: true },
          renameByName: { page_url: 'Page', 'Value #A': 'Events' },
          indexByName: { page_url: 0, 'Value #A': 1 },
        },
      },
    ],
  });

  const eventLogsData = new SceneQueryRunner({
    datasource: FARO_DS_REF,
    queries: [
      {
        refId: 'A',
        expr: `${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "event"`,
        instant: false,
        range: true,
      },
    ],
  });

  return new EmbeddedScene({
    $variables: createFaroVariableSet(apps),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: 250,
          body: new SceneFlexLayout({
            direction: 'row',
            children: [
              new SceneFlexItem({
                width: '65%',
                body: PanelBuilders.timeseries()
                  .setTitle('Events over time')
                  .setDescription('Event count over time broken down by event name. Shows which events are most frequent and when activity spikes occur.')
                  .setData(eventsOverTimeData)
                  .setUnit('short')
                  .setCustomFieldConfig('fillOpacity', 10)
                  .build(),
              }),
              new SceneFlexItem({
                width: '35%',
                body: PanelBuilders.table()
                  .setTitle('Events by page')
                  .setDescription('Top 10 pages by total event count in the selected time range.')
                  .setData(topPagesData)
                  .build(),
              }),
            ],
          }),
        }),
        new SceneFlexItem({
          minHeight: 300,
          body: PanelBuilders.logs()
            .setTitle('Event log')
            .setData(eventLogsData)
            .build(),
        }),
      ],
    }),
    controls: createFaroControls(),
  });
}
