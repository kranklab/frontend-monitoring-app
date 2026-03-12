import {
  EmbeddedScene,
  PanelBuilders,
  SceneDataTransformer,
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

function statQuery(expr: string) {
  return new SceneQueryRunner({
    datasource: FARO_DS_REF,
    queries: [{ refId: 'A', expr, instant: true, range: false }],
  });
}

function vitalStatExpr(field: string) {
  return `avg(avg_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "measurement" | ${field} != "" | unwrap ${field} [$__range]))`;
}

export function overviewScene(app: FaroApp) {
  // ── Page performance table ──────────────────────────────────────────────
  // Multiple instant metric queries joined by page_url label.
  const pagePerformanceData = new SceneDataTransformer({
    $data: new SceneQueryRunner({
      datasource: FARO_DS_REF,
      queries: [
        {
          refId: 'LCP',
          expr: `avg by (page_url) (avg_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "measurement" | lcp != "" | unwrap lcp [$__range]))`,
          instant: true,
          range: false,
        },
        {
          refId: 'TTFB',
          expr: `avg by (page_url) (avg_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "measurement" | ttfb != "" | unwrap ttfb [$__range]))`,
          instant: true,
          range: false,
        },
        {
          refId: 'FCP',
          expr: `avg by (page_url) (avg_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "measurement" | fcp != "" | unwrap fcp [$__range]))`,
          instant: true,
          range: false,
        },
        {
          refId: 'CLS',
          expr: `avg by (page_url) (avg_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "measurement" | cls != "" | unwrap cls [$__range]))`,
          instant: true,
          range: false,
        },
        {
          refId: 'INP',
          expr: `avg by (page_url) (avg_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "measurement" | inp != "" | unwrap inp [$__range]))`,
          instant: true,
          range: false,
        },
        {
          refId: 'Errors',
          expr: `sum by (page_url) (count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "exception" [$__range]))`,
          instant: true,
          range: false,
        },
      ],
    }),
    transformations: [
      { id: 'labelsToFields', options: { mode: 'columns' } },
      { id: 'joinByField', options: { byField: 'page_url' } },
      {
        id: 'organize',
        options: {
          excludeByName: {
            'Time 1': true,
            'Time 2': true,
            'Time 3': true,
            'Time 4': true,
            'Time 5': true,
            'Time 6': true,
          },
          renameByName: {
            'Value #LCP': 'LCP (ms)',
            'Value #TTFB': 'TTFB (ms)',
            'Value #FCP': 'FCP (ms)',
            'Value #CLS': 'CLS',
            'Value #INP': 'INP (ms)',
            'Value #Errors': 'Errors',
          },
          indexByName: {
            page_url: 0,
            'Value #TTFB': 1,
            'Value #FCP': 2,
            'Value #LCP': 3,
            'Value #CLS': 4,
            'Value #INP': 5,
            'Value #Errors': 6,
          },
        },
      },
    ],
  });

  // ── Over-time charts ────────────────────────────────────────────────────
  const errorsOverTimeData = new SceneQueryRunner({
    datasource: FARO_DS_REF,
    queries: [
      {
        refId: 'A',
        expr: `sum by (page_url) (count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "exception" [$__interval]))`,
        instant: false,
        range: true,
      },
    ],
  });

  const lcpOverTimeData = new SceneQueryRunner({
    datasource: FARO_DS_REF,
    queries: [
      {
        refId: 'A',
        expr: `avg_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "measurement" | lcp != "" | unwrap lcp [$__interval])`,
        instant: false,
        range: true,
      },
    ],
  });

  return new EmbeddedScene({
    $variables: createFaroVariableSet(app),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        // ── Row 1: Stats ──────────────────────────────────────────────────
        new SceneFlexItem({
          height: 100,
          body: new SceneFlexLayout({
            direction: 'row',
            children: [
              new SceneFlexItem({
                body: PanelBuilders.stat()
                  .setTitle('JS Errors')
                  .setDescription(
                    'Total number of JavaScript exceptions captured by the Faro SDK in the selected time range.'
                  )
                  .setData(
                    statQuery(
                      `sum(count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | kind = "exception" [$__range]))`
                    )
                  )
                  .setUnit('short')
                  .setColor({ mode: 'thresholds' })
                  .setThresholds({
                    mode: ThresholdsMode.Absolute,
                    steps: [
                      { color: 'green', value: 0 },
                      { color: 'yellow', value: 10 },
                      { color: 'red', value: 100 },
                    ],
                  })
                  .build(),
              }),
              new SceneFlexItem({
                body: PanelBuilders.stat()
                  .setTitle('TTFB')
                  .setDescription(
                    'Time to First Byte — how long until the browser receives the first byte of the page response. Measures server and network latency. Good: <800ms, Needs improvement: <1800ms.'
                  )
                  .setData(statQuery(vitalStatExpr('ttfb')))
                  .setUnit('ms')
                  .setColor({ mode: 'thresholds' })
                  .setThresholds({
                    mode: ThresholdsMode.Absolute,
                    steps: [
                      { color: 'green', value: 0 },
                      { color: 'yellow', value: 800 },
                      { color: 'red', value: 1800 },
                    ],
                  })
                  .build(),
              }),
              new SceneFlexItem({
                body: PanelBuilders.stat()
                  .setTitle('FCP')
                  .setDescription(
                    'First Contentful Paint — time until the browser renders the first piece of content (text, image, etc.). Good: <1800ms, Needs improvement: <3000ms.'
                  )
                  .setData(statQuery(vitalStatExpr('fcp')))
                  .setUnit('ms')
                  .setColor({ mode: 'thresholds' })
                  .setThresholds({
                    mode: ThresholdsMode.Absolute,
                    steps: [
                      { color: 'green', value: 0 },
                      { color: 'yellow', value: 1800 },
                      { color: 'red', value: 3000 },
                    ],
                  })
                  .build(),
              }),
              new SceneFlexItem({
                body: PanelBuilders.stat()
                  .setTitle('LCP')
                  .setDescription(
                    'Largest Contentful Paint — time until the largest visible element (hero image, heading, etc.) finishes rendering. Core Web Vital. Good: <2500ms, Needs improvement: <4000ms.'
                  )
                  .setData(statQuery(vitalStatExpr('lcp')))
                  .setUnit('ms')
                  .setColor({ mode: 'thresholds' })
                  .setThresholds({
                    mode: ThresholdsMode.Absolute,
                    steps: [
                      { color: 'green', value: 0 },
                      { color: 'yellow', value: 2500 },
                      { color: 'red', value: 4000 },
                    ],
                  })
                  .build(),
              }),
              new SceneFlexItem({
                body: PanelBuilders.stat()
                  .setTitle('CLS')
                  .setDescription(
                    "Cumulative Layout Shift — measures visual stability. A low score means elements don't unexpectedly move during load. Core Web Vital. Good: <0.1, Needs improvement: <0.25."
                  )
                  .setData(statQuery(vitalStatExpr('cls')))
                  .setUnit('short')
                  .setColor({ mode: 'thresholds' })
                  .setThresholds({
                    mode: ThresholdsMode.Absolute,
                    steps: [
                      { color: 'green', value: 0 },
                      { color: 'yellow', value: 0.1 },
                      { color: 'red', value: 0.25 },
                    ],
                  })
                  .build(),
              }),
              new SceneFlexItem({
                body: PanelBuilders.stat()
                  .setTitle('INP')
                  .setDescription(
                    'Interaction to Next Paint — measures responsiveness to user interactions (clicks, taps, key presses). Replaces FID as a Core Web Vital. Good: <200ms, Needs improvement: <500ms.'
                  )
                  .setData(statQuery(vitalStatExpr('inp')))
                  .setUnit('ms')
                  .setColor({ mode: 'thresholds' })
                  .setThresholds({
                    mode: ThresholdsMode.Absolute,
                    steps: [
                      { color: 'green', value: 0 },
                      { color: 'yellow', value: 200 },
                      { color: 'red', value: 500 },
                    ],
                  })
                  .build(),
              }),
              new SceneFlexItem({
                body: PanelBuilders.stat()
                  .setTitle('Sessions')
                  .setDescription(
                    'Number of unique user sessions in the selected time range, identified by session ID assigned by the Faro SDK.'
                  )
                  .setData(
                    statQuery(
                      `count(count by (session_id) (count_over_time(${FARO_STREAM} | logfmt ${FARO_URL_FILTER} | session_id != "" [$__range])))`
                    )
                  )
                  .setUnit('short')
                  .setColor({ mode: 'fixed', fixedColor: 'blue' })
                  .build(),
              }),
            ],
          }),
        }),

        // ── Row 2: Page Performance Table ─────────────────────────────────
        new SceneFlexItem({
          minHeight: 200,
          body: PanelBuilders.table()
            .setTitle('Page Performance')
            .setDescription(
              'Average web vital scores and error count per page URL over the selected time range. Use this to identify which pages have the worst performance.'
            )
            .setData(pagePerformanceData)
            .build(),
        }),

        // ── Row 3: Charts ─────────────────────────────────────────────────
        new SceneFlexItem({
          minHeight: 250,
          body: new SceneFlexLayout({
            direction: 'row',
            children: [
              new SceneFlexItem({
                width: '50%',
                body: PanelBuilders.timeseries()
                  .setTitle('Errors over time')
                  .setDescription(
                    'JavaScript exception count over time, broken down by page URL. Spikes indicate increased error rates on specific pages.'
                  )
                  .setData(errorsOverTimeData)
                  .setUnit('short')
                  .setCustomFieldConfig('fillOpacity', 10)
                  .build(),
              }),
              new SceneFlexItem({
                width: '50%',
                body: PanelBuilders.timeseries()
                  .setTitle('LCP over time')
                  .setDescription(
                    'Largest Contentful Paint trend over time. Rising values indicate degrading load performance — investigate backend latency, asset size, or CDN issues.'
                  )
                  .setData(lcpOverTimeData)
                  .setUnit('ms')
                  .setCustomFieldConfig('fillOpacity', 10)
                  .setThresholds({
                    mode: ThresholdsMode.Absolute,
                    steps: [
                      { color: 'green', value: 0 },
                      { color: 'yellow', value: 2500 },
                      { color: 'red', value: 4000 },
                    ],
                  })
                  .build(),
              }),
            ],
          }),
        }),
      ],
    }),
    controls: createFaroControls(),
  });
}
