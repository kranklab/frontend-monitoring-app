import React from 'react';
import { SceneApp, SceneTimeRange, useSceneApp } from '@grafana/scenes';
import { AppRootProps } from '@grafana/data';
import { PluginPropsContext } from '../../utils/utils.plugin';
import { createOverviewPage } from '../../pages/Overview/overviewPage';
import { createSessionsPage } from '../../pages/Sessions/sessionsPage';
import { createSettingsPage } from '../../pages/Settings/settingsPage';
import { createTracesPage } from '../../pages/Traces/tracesPage';
import { createWebVitalsPage } from '../../pages/WebVitals/webVitalsPage';
import { createErrorsPage } from '../../pages/Errors/errorsPage';
import { createEventsPage } from '../../pages/Events/eventsPage';
import { HomePage } from '../../pages/Home/HomePage';
import { AppJsonData, FaroApp } from '../../constants';

function getSceneApp(apps: FaroApp[]) {
  return new SceneApp({
    $timeRange: new SceneTimeRange({ from: 'now-1h', to: 'now' }),
    pages: [
      createOverviewPage(apps),
      createWebVitalsPage(apps),
      createErrorsPage(apps),
      createEventsPage(apps),
      createSessionsPage(apps),
      createTracesPage(),
      createSettingsPage(),
    ],
    urlSyncOptions: {
      updateUrlOnInit: true,
      createBrowserHistorySteps: true,
    },
  });
}

function AppWithScenes({ apps }: { apps: FaroApp[] }) {
  const scene = useSceneApp(() => getSceneApp(apps));
  return <scene.Component model={scene} />;
}

function App(props: AppRootProps) {
  const apps = (props.meta.jsonData as AppJsonData)?.apps ?? [];

  return (
    <PluginPropsContext.Provider value={props}>
      {apps.length > 0 ? <AppWithScenes apps={apps} /> : <HomePage />}
    </PluginPropsContext.Provider>
  );
}

export default App;
