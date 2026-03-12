import { EmbeddedScene, PanelBuilders, SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from '@grafana/scenes';
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
  needsImprovementThreshold: number,
  gaugeDescription: string,
  timeseriesDescription: string
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
            .setDescription(gaugeDescription)
            .setData(vitalStatQuery(metric))
            .setUnit(unit)
            .setThresholds(thresholds)
            .setColor({ mode: 'thresholds' })
            .build(),
        }),
        new SceneFlexItem({
          body: PanelBuilders.timeseries()
            .setTitle(`${label} over time`)
            .setDescription(timeseriesDescription)
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

export function webVitalsScene(app: FaroApp) {
  return new EmbeddedScene({
    $variables: createFaroVariableSet(app),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        vitalRow(
          'LCP (Largest Contentful Paint)',
          'lcp',
          'ms',
          2500,
          4000,
          'Largest Contentful Paint — time until the largest visible element (hero image, heading, etc.) finishes rendering. Core Web Vital. Good: <2500ms, Needs improvement: <4000ms.',
          'Average LCP over time. Spikes indicate pages where the main content takes longer to render, often caused by slow image loads or server response times.'
        ),
        vitalRow(
          'FCP (First Contentful Paint)',
          'fcp',
          'ms',
          1800,
          3000,
          'First Contentful Paint — time until the browser renders the first piece of content (text, image, canvas, etc.). Good: <1800ms, Needs improvement: <3000ms.',
          'Average FCP over time. Rising values may indicate render-blocking resources (fonts, CSS, scripts) or slow server responses delaying the first paint.'
        ),
        vitalRow(
          'CLS (Cumulative Layout Shift)',
          'cls',
          'short',
          0.1,
          0.25,
          "Cumulative Layout Shift — measures visual stability. A low score means elements don't unexpectedly move during load. Core Web Vital. Good: <0.1, Needs improvement: <0.25.",
          'Average CLS score over time. High values mean content is shifting unexpectedly after load, which can cause users to misclick. Common causes: images without dimensions, late-loading ads or embeds.'
        ),
        vitalRow(
          'INP (Interaction to Next Paint)',
          'inp',
          'ms',
          200,
          500,
          'Interaction to Next Paint — measures responsiveness to user interactions (clicks, taps, key presses). Replaces FID as a Core Web Vital. Good: <200ms, Needs improvement: <500ms.',
          'Average INP over time. High values indicate the page is slow to respond to user input, often caused by long JavaScript tasks blocking the main thread.'
        ),
        vitalRow(
          'TTFB (Time to First Byte)',
          'ttfb',
          'ms',
          800,
          1800,
          'Time to First Byte — how long until the browser receives the first byte of the page response. Measures server and network latency. Good: <800ms, Needs improvement: <1800ms.',
          'Average TTFB over time. Sustained high values point to slow backend responses or network latency. This is typically the earliest signal of server-side performance issues.'
        ),
      ],
    }),
    controls: createFaroControls(),
  });
}
