import React, { ChangeEvent, useState } from 'react';
import { Button, Combobox, Field, Input, Stack, Text, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { css } from '@emotion/css';
import { usePluginMeta } from '../../utils/utils.plugin';
import { useLokiDatasources, useTempoDatasources } from '../../utils/utils.datasources';
import { AppJsonData, PLUGIN_BASE_URL, ROUTES } from '../../constants';

export function HomePage() {
  const meta = usePluginMeta();
  const s = useStyles2(getStyles);
  const lokiDatasources = useLokiDatasources();
  const tempoDatasources = useTempoDatasources();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [lokiUid, setLokiUid] = useState('');
  const [tempoUid, setTempoUid] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isValidUrl = (val: string) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl(url)) {
      setError('Please enter a valid URL including the protocol (e.g. https://myapp.com)');
      return;
    }
    if (!serviceName.trim()) {
      setError('Service name is required');
      return;
    }
    setError('');
    setSaving(true);

    const existingApps = (meta?.jsonData as AppJsonData)?.apps ?? [];
    const appName = name.trim() || new URL(url).hostname;

    try {
      await getBackendSrv().post(`/api/plugins/${meta?.id}/settings`, {
        enabled: meta?.enabled ?? true,
        pinned: true,
        jsonData: {
          apps: [
            ...existingApps,
            {
              name: appName,
              url: url.trim(),
              serviceName: serviceName.trim(),
              lokiUid: lokiUid || undefined,
              tempoUid: tempoUid || undefined,
            },
          ],
        },
      });
      window.location.href = `${PLUGIN_BASE_URL}/${ROUTES.Overview}`;
    } catch (err) {
      console.error('Failed to save app', err);
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className={s.wrapper}>
      <div className={s.card}>
        <Stack direction="column" gap={4}>
          <Stack direction="column" gap={1}>
            <Text element="h1" variant="h2">
              Frontend Monitoring
            </Text>
            <Text color="secondary">Add your Faro-instrumented app to start seeing real user monitoring data.</Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack direction="column" gap={3}>
              <Field
                label="App URL"
                description="The URL of the app you have instrumented with the Grafana Faro SDK"
                invalid={Boolean(error && !url)}
                error={error}
              >
                <Input
                  id="app-url"
                  placeholder="https://myapp.com"
                  value={url}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                />
              </Field>

              <Field
                label="Service name"
                description={
                  <>
                    Must match the <code>app.name</code> you set in Faro
                  </>
                }
                invalid={Boolean(error && !serviceName)}
                error={error}
              >
                <Input
                  id="service-name"
                  placeholder="my-app"
                  value={serviceName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setServiceName(e.target.value)}
                />
              </Field>

              <Field label="Display name" description="Optional — defaults to the hostname if left blank">
                <Input
                  placeholder="My App"
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                />
              </Field>

              <Field
                label="Loki datasource"
                description="Optional — if not set, the first available Loki datasource is used"
              >
                <Combobox
                  placeholder="Select a Loki datasource"
                  options={lokiDatasources}
                  value={lokiUid || null}
                  onChange={(v) => setLokiUid(v?.value ?? '')}
                  isClearable
                />
              </Field>

              <Field
                label="Tempo datasource"
                description="Optional — enables the Traces page to open queries directly in Explore"
              >
                <Combobox
                  placeholder="Select a Tempo datasource"
                  options={tempoDatasources}
                  value={tempoUid || null}
                  onChange={(v) => setTempoUid(v?.value ?? '')}
                  isClearable
                />
              </Field>

              <Button type="submit" disabled={!url || !serviceName || saving}>
                {saving ? 'Saving...' : 'Add app'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: ${theme.spacing(10, 2)};
  `,
  card: css`
    width: 100%;
    max-width: 480px;
    padding: ${theme.spacing(4)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    border: 1px solid ${theme.colors.border.weak};

    /* Make Field labels and inputs fill the card width */
    & label {
      display: block;
    }
    & input {
      width: 100% !important;
    }

    /* Style inline code blocks in field descriptions */
    & code {
      font-family: ${theme.typography.fontFamilyMonospace};
      font-size: ${theme.typography.bodySmall.fontSize};
      background: ${theme.colors.background.canvas};
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
      padding: 1px 4px;
    }
  `,
});
