import React, { useState } from 'react';
import { SceneApp, SceneTimeRange, useSceneApp } from '@grafana/scenes';
import { AppRootProps } from '@grafana/data';
import { PluginPropsContext } from '../../utils/utils.plugin';
import { AppSelectionContext } from '../../utils/utils.appSelection';
import { createOverviewPage } from '../../pages/Overview/overviewPage';
import { createSessionsPage } from '../../pages/Sessions/sessionsPage';
import { createSettingsPage } from '../../pages/Settings/settingsPage';
import { createTracesPage } from '../../pages/Traces/tracesPage';
import { createWebVitalsPage } from '../../pages/WebVitals/webVitalsPage';
import { createErrorsPage } from '../../pages/Errors/errorsPage';
import { createEventsPage } from '../../pages/Events/eventsPage';
import { HomePage } from '../../pages/Home/HomePage';
import { AppJsonData, FaroApp } from '../../constants';

function getSceneApp(app: FaroApp) {
  return new SceneApp({
    $timeRange: new SceneTimeRange({ from: 'now-1h', to: 'now' }),
    pages: [
      createOverviewPage(app),
      createWebVitalsPage(app),
      createErrorsPage(app),
      createEventsPage(app),
      createSessionsPage(app),
      createTracesPage(),
      createSettingsPage(),
    ],
    urlSyncOptions: {
      updateUrlOnInit: true,
      createBrowserHistorySteps: true,
    },
  });
}

function AppWithScenes({ app }: { app: FaroApp }) {
  const scene = useSceneApp(() => getSceneApp(app));
  return <scene.Component model={scene} />;
}

function App(props: AppRootProps) {
  const apps = (props.meta.jsonData as AppJsonData)?.apps ?? [];

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const stored = localStorage.getItem('faro-selected-app');
    const idx = stored ? parseInt(stored, 10) : 0;
    return Math.max(0, Math.min(idx, apps.length - 1));
  });

  const selectApp = (index: number) => {
    localStorage.setItem('faro-selected-app', String(index));
    setSelectedIndex(index);
  };

  return (
    <PluginPropsContext.Provider value={props}>
      <AppSelectionContext.Provider value={{ selectedIndex, selectApp }}>
        {apps.length > 0 ? <AppWithScenes key={selectedIndex} app={apps[selectedIndex]} /> : <HomePage />}
      </AppSelectionContext.Provider>
    </PluginPropsContext.Provider>
  );
}

export default App;
