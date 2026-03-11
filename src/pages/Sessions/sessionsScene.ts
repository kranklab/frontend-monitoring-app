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

export function sessionsScene(apps: FaroApp[]) {
  const sessionsOverviewData = new SceneQueryRunner({
    datasource: FARO_DS_REF,
    queries: [
      {
        refId: 'A',
        expr: `sum by (page_url) (count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | session_id != "" [$__auto]))`,
        instant: false,
        range: true,
        legendFormat: '{{page_url}}',
      },
    ],
  });

  const sessionsTableData = new SceneDataTransformer({
    $data: new SceneQueryRunner({
      datasource: FARO_DS_REF,
      queries: [
        {
          refId: 'A',
          expr: `sum by (session_id, page_url, browser_name, browser_version, browser_os) (count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | session_id != "" [$__range]))`,
          instant: true,
          range: false,
        },
        {
          refId: 'Errors',
          expr: `sum by (session_id) (count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "exception" [$__range]))`,
          instant: true,
          range: false,
        },
      ],
    }),
    transformations: [
      { id: 'labelsToFields', options: { mode: 'columns' } },
      { id: 'merge', options: {} },
      {
        id: 'organize',
        options: {
          excludeByName: { Time: true, 'Value #A': true },
          renameByName: {
            session_id: 'Session ID',
            page_url: 'Page',
            browser_name: 'Browser',
            browser_version: 'Version',
            browser_os: 'Platform',
            'Value #Errors': 'Errors',
          },
          indexByName: {
            session_id: 0,
            page_url: 1,
            browser_name: 2,
            browser_version: 3,
            browser_os: 4,
            'Value #Errors': 5,
          },
        },
      },
    ],
  });

  return new EmbeddedScene({
    $variables: createFaroVariableSet(apps),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: 200,
          body: PanelBuilders.timeseries()
            .setTitle('Sessions overview')
            .setDescription(
              'Activity over time broken down by page URL. Each bar represents log activity from user sessions on that page.'
            )
            .setData(sessionsOverviewData)
            .setUnit('short')
            .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars)
            .setCustomFieldConfig('fillOpacity', 80)
            .setCustomFieldConfig('lineWidth', 0)
            .setCustomFieldConfig('stacking', { mode: StackingMode.Normal, group: 'A' })
            .build(),
        }),
        new SceneFlexItem({
          minHeight: 400,
          body: PanelBuilders.table()
            .setTitle('Sessions')
            .setDescription('One row per unique session in the selected time range, showing browser and page context.')
            .setData(sessionsTableData)
            .build(),
        }),
      ],
    }),
    controls: createFaroControls(),
  });
}
