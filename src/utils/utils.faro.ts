import {
  ConstantVariable,
  DataSourceVariable,
  SceneControlsSpacer,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { VariableHide } from '@grafana/data';
import { FaroApp } from '../constants';

export const FARO_DS_REF = { uid: '${datasource}' };
export const TEMPO_DS_REF = { uid: '${tempo}' };

// Stream selector for Faro logs.
// Alloy's faro.receiver writes logfmt log lines, with page_url as a logfmt field.
export const FARO_STREAM = '{service_name=~".+"}';
export const FARO_URL_FILTER = '| page_url =~ ".*$url.*"';

export function createFaroVariableSet(apps: FaroApp[]) {
  const lokiUid = apps[0]?.lokiUid;

  // If a Loki UID was configured during onboarding use it directly, otherwise
  // fall back to auto-selecting the first available Loki datasource. Either way
  // the variable is hidden — only the app name shows in the controls bar.
  const datasourceVariable = lokiUid
    ? new ConstantVariable({ name: 'datasource', value: lokiUid, hide: VariableHide.hideVariable })
    : new DataSourceVariable({ name: 'datasource', pluginId: 'loki', hide: VariableHide.hideVariable });

  const urlVariable = new ConstantVariable({
    name: 'url',
    label: apps[0]?.name ?? 'App',
    value: apps[0]?.url ?? '',
  });

  return new SceneVariableSet({ variables: [datasourceVariable, urlVariable] });
}

export function createTraceVariableSet(apps: FaroApp[]) {
  const tempoVariable = new DataSourceVariable({
    name: 'tempo',
    label: 'Tempo Datasource',
    pluginId: 'tempo',
  });

  const appNameVariable = new ConstantVariable({
    name: 'app_display',
    label: apps[0]?.name ?? 'App',
    value: apps[0]?.name ?? '',
  });

  const serviceNameVariable = new ConstantVariable({
    name: 'service_name',
    value: apps[0]?.serviceName ?? '',
    hide: VariableHide.hideVariable,
  });

  return new SceneVariableSet({ variables: [tempoVariable, appNameVariable, serviceNameVariable] });
}

export function createFaroControls() {
  return [
    new VariableValueSelectors({}),
    new SceneControlsSpacer(),
    new SceneTimePicker({ isOnCanvas: true }),
    new SceneRefreshPicker({
      intervals: ['5s', '1m', '5m', '15m'],
      isOnCanvas: true,
    }),
  ];
}
