import {
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
} from '@grafana/scenes';
import { ThresholdsMode } from '@grafana/data';
import {
  createFaroControls,
  createFaroVariableSet,
  FARO_DS_REF,
  FARO_STREAM,
  FARO_URL_FILTER,
} from '../../utils/utils.faro';
import { FaroApp } from '../../constants';

function vitalQuery(metric: string, instant = false) {
  return new SceneQueryRunner({
    datasource: FARO_DS_REF,
    queries: [
      {
        refId: 'A',
        expr: `avg_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "measurement" | ${metric} != "" | unwrap ${metric} [$__interval])`,
        instant,
        range: !instant,
      },
    ],
  });
}

function vitalStatQuery(metric: string) {
  return new SceneQueryRunner({
    datasource: FARO_DS_REF,
    queries: [
      {
        refId: 'A',
        expr: `avg(avg_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "measurement" | ${metric} != "" | unwrap ${metric} [$__range]))`,
        instant: true,
        range: false,
      },
    ],
  });
}

function vitalRow(
  label: string,
  metric: string,
  unit: string,
  goodThreshold: number,
  needsImprovementThreshold: number
) {
  const thresholds = {
    mode: ThresholdsMode.Absolute as const,
    steps: [
      { color: 'green', value: 0 },
      { color: 'yellow', value: goodThreshold },
      { color: 'red', value: needsImprovementThreshold },
    ],
  };

  return new SceneFlexItem({
    minHeight: 200,
    body: new SceneFlexLayout({
      direction: 'row',
      children: [
        new SceneFlexItem({
          width: 200,
          body: PanelBuilders.gauge()
            .setTitle(label)
            .setData(vitalStatQuery(metric))
            .setUnit(unit)
            .setThresholds(thresholds)
            .setColor({ mode: 'thresholds' })
            .build(),
        }),
        new SceneFlexItem({
          body: PanelBuilders.timeseries()
            .setTitle(`${label} over time`)
            .setData(vitalQuery(metric))
            .setUnit(unit)
            .setThresholds(thresholds)
            .setCustomFieldConfig('fillOpacity', 10)
            .build(),
        }),
      ],
    }),
  });
}

export function webVitalsScene(apps: FaroApp[]) {

  return new EmbeddedScene({
    $variables: createFaroVariableSet(apps),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        vitalRow('LCP (Largest Contentful Paint)', 'lcp', 'ms', 2500, 4000),
        vitalRow('FCP (First Contentful Paint)', 'fcp', 'ms', 1800, 3000),
        vitalRow('CLS (Cumulative Layout Shift)', 'cls', 'short', 0.1, 0.25),
        vitalRow('INP (Interaction to Next Paint)', 'inp', 'ms', 200, 500),
        vitalRow('TTFB (Time to First Byte)', 'time_to_first_byte', 'ms', 800, 1800),
      ],
    }),
    controls: createFaroControls(),
  });
}