import React from 'react';
import { Button, Stack, Text, useStyles2 } from '@grafana/ui';
import { PluginConfigPageProps, AppPluginMeta, GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { css } from '@emotion/css';
import { AppJsonData, FaroApp } from '../../constants';

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppJsonData>> {}

const AppConfig = ({ plugin }: AppConfigProps) => {
  const s = useStyles2(getStyles);
  const { enabled, jsonData } = plugin.meta;
  const apps: FaroApp[] = jsonData?.apps ?? [];

  const removeApp = async (index: number) => {
    const updated = apps.filter((_, i) => i !== index);
    try {
      await getBackendSrv().post(`/api/plugins/${plugin.meta.id}/settings`, {
        enabled: enabled ?? true,
        pinned: true,
        jsonData: { apps: updated },
      });
      window.location.reload();
    } catch (e) {
      console.error('Failed to remove app', e);
    }
  };

  return (
    <div className={s.wrapper}>
      <Stack direction="column" gap={3}>
        <Text element="h3" variant="h5">
          Monitored apps
        </Text>

        {apps.length === 0 ? (
          <Text color="secondary">No apps configured. Open the plugin to add one.</Text>
        ) : (
          <Stack direction="column" gap={1}>
            {apps.map((app, i) => (
              <div key={i} className={s.appRow}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="column" gap={0}>
                    <Text variant="body">{app.name}</Text>
                    <Text color="secondary" variant="bodySmall">
                      {app.url}
                    </Text>
                  </Stack>
                  <Button variant="destructive" size="sm" onClick={() => removeApp(i)}>
                    Remove
                  </Button>
                </Stack>
              </div>
            ))}
          </Stack>
        )}
      </Stack>
    </div>
  );
};

export default AppConfig;

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    margin-top: ${theme.spacing(4)};
    max-width: 600px;
  `,
  appRow: css`
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
  `,
});