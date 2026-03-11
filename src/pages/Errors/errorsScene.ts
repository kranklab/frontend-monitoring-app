import {
  EmbeddedScene,
  PanelBuilders,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
} from '@grafana/scenes';
import { GraphDrawStyle, StackingMode } from '@grafana/schema';
import {
  createFaroControls,
  createFaroVariableSet,
  FARO_DS_REF,
  FARO_STREAM,
  FARO_URL_FILTER,
} from '../../utils/utils.faro';
import { FaroApp } from '../../constants';

export function errorsScene(apps: FaroApp[]) {
  const errorsOverTimeData = new SceneQueryRunner({
    datasource: FARO_DS_REF,
    queries: [
      {
        refId: 'A',
        expr: `sum(count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "measurement" | type = "web-vitals" [$__auto]))`,
        instant: false,
        range: true,
        legendFormat: 'Page Loads',
      },
      {
        refId: 'B',
        expr: `sum(count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "exception" [$__auto]))`,
        instant: false,
        range: true,
        legendFormat: 'Errors',
      },
    ],
  });

  const errorsByTypeData = new SceneDataTransformer({
    $data: new SceneQueryRunner({
      datasource: FARO_DS_REF,
      queries: [
        {
          refId: 'A',
          expr: `topk(10, sum by (type, value) (count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "exception" [$__range])))`,
          instant: true,
          range: false,
          legendFormat: '{{type}}: {{value}}',
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
          renameByName: { type: 'Type', value: 'Message', 'Value #A': 'Count' },
          indexByName: { type: 0, value: 1, 'Value #A': 2 },
        },
      },
    ],
  });

  const errorLogsData = new SceneQueryRunner({
    datasource: FARO_DS_REF,
    queries: [
      {
        refId: 'A',
        expr: `${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "exception"`,
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
          body: PanelBuilders.timeseries()
            .setTitle('Page Loads & Errors')
            .setDescription(
              'Total page loads (blue) with errors (red) stacked on top. The red portion shows how many loads had a JS error.'
            )
            .setData(errorsOverTimeData)
            .setUnit('short')
            .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars)
            .setCustomFieldConfig('fillOpacity', 80)
            .setCustomFieldConfig('lineWidth', 0)
            .setCustomFieldConfig('stacking', { mode: StackingMode.Normal, group: 'A' })
            .build(),
        }),
        new SceneFlexItem({
          minHeight: 300,
          body: new SceneFlexLayout({
            direction: 'row',
            children: [
              new SceneFlexItem({
                width: '40%',
                body: PanelBuilders.table()
                  .setTitle('Errors by type')
                  .setDescription('Top 10 exception types in the selected time range, sorted by frequency.')
                  .setData(errorsByTypeData)
                  .build(),
              }),
              new SceneFlexItem({
                body: PanelBuilders.logs().setTitle('Error log').setData(errorLogsData).build(),
              }),
            ],
          }),
        }),
      ],
    }),
    controls: createFaroControls(),
  });
}
