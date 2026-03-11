import { SceneAppPage } from '@grafana/scenes';
import { webVitalsScene } from './webVitalsScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES, FaroApp } from '../../constants';

export function createWebVitalsPage(apps: FaroApp[]) {
  return new SceneAppPage({
    title: 'Web Vitals',
    url: prefixRoute(ROUTES.WebVitals),
    routePath: ROUTES.WebVitals,
    subTitle: 'Core Web Vitals — LCP, FCP, CLS, FID and TTFB from Faro SDK measurements.',
    getScene: () => webVitalsScene(apps),
  });
}
