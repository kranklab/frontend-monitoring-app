import React from 'react';
import { Button, Stack, Text, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { usePluginMeta } from '../../utils/utils.plugin';
import { useAppSelection } from '../../utils/utils.appSelection';
import { AppJsonData, FaroApp } from '../../constants';

function buildExploreUrl(tempoUid: string, query: string): string {
  const state = {
    datasource: tempoUid,
    queries: [{ refId: 'A', queryType: 'traceql', query, limit: 50 }],
    range: { from: 'now-1h', to: 'now' },
  };
  return `/explore?orgId=1&left=${encodeURIComponent(JSON.stringify(state))}`;
}

function ConfiguredTraces({ app }: { app: FaroApp }) {
  const s = useStyles2(getStyles);
  const allTracesUrl = buildExploreUrl(app.tempoUid!, `{resource.service.name=~".*${app.serviceName}.*"}`);
  const errorTracesUrl = buildExploreUrl(
    app.tempoUid!,
    `{resource.service.name=~".*${app.serviceName}.*" && status=error}`
  );

  return (
    <div className={s.wrapper}>
      <Stack direction="column" gap={4}>
        <Stack direction="column" gap={1}>
          <Text element="h1" variant="h2">
            Traces
          </Text>
          <Text color="secondary">
            Distributed traces for <strong>{app.name}</strong> — service name: <code>{app.serviceName}</code>
          </Text>
        </Stack>

        <Stack direction="row" gap={2}>
          <div className={s.card}>
            <Stack direction="column" gap={2}>
              <Text variant="h5">All traces</Text>
              <Text color="secondary">
                All traces where <code>resource.service.name</code> matches <code>{app.serviceName}</code>.
              </Text>
              <Button icon="external-link-alt" onClick={() => window.open(allTracesUrl, '_blank')}>
                Open in Explore
              </Button>
            </Stack>
          </div>

          <div className={s.card}>
            <Stack direction="column" gap={2}>
              <Text variant="h5">Error traces</Text>
              <Text color="secondary">
                Only traces with <code>status=error</code> — useful for pinpointing failed requests.
              </Text>
              <Button
                variant="destructive"
                icon="external-link-alt"
                onClick={() => window.open(errorTracesUrl, '_blank')}
              >
                Open in Explore
              </Button>
            </Stack>
          </div>
        </Stack>
      </Stack>
    </div>
  );
}

function NoTempoConfigured() {
  const s = useStyles2(getStyles);
  return (
    <div className={s.wrapper}>
      <Stack direction="column" gap={2}>
        <Text element="h1" variant="h2">
          Traces
        </Text>
        <Text color="secondary">
          No Tempo datasource configured. Go to <strong>Frontend Monitoring</strong> and edit the app to add a Tempo
          datasource.
        </Text>
      </Stack>
    </div>
  );
}

export function TracesPage() {
  const meta = usePluginMeta();
  const { selectedIndex } = useAppSelection();
  const apps = (meta?.jsonData as AppJsonData)?.apps ?? [];
  const app = apps[selectedIndex];

  if (!app?.tempoUid) {
    return <NoTempoConfigured />;
  }

  return <ConfiguredTraces app={app} />;
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    padding: ${theme.spacing(4, 2)};
    max-width: 800px;
  `,
  card: css`
    flex: 1;
    padding: ${theme.spacing(3)};
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
  `,
});
