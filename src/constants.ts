import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Overview = 'overview',
  Sessions = 'sessions',
  Traces = 'traces',
  WebVitals = 'web-vitals',
  Errors = 'errors',
  Events = 'events',
  Settings = 'settings',
}

export type FaroApp = {
  name: string;
  url: string;
  serviceName: string;
  lokiUid?: string;
  tempoUid?: string;
};

export type AppJsonData = {
  apps?: FaroApp[];
};
