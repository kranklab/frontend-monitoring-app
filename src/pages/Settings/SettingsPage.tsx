import React, { ChangeEvent, useState } from 'react';
import { Button, Combobox, Field, Input, Stack, Text, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { css } from '@emotion/css';
import { usePluginMeta } from '../../utils/utils.plugin';
import { useLokiDatasources, useTempoDatasources } from '../../utils/utils.datasources';
import { AppJsonData, FaroApp } from '../../constants';

export function SettingsPage() {
  const meta = usePluginMeta();
  const s = useStyles2(getStyles);
  const lokiDatasources = useLokiDatasources();
  const tempoDatasources = useTempoDatasources();
  const apps: FaroApp[] = (meta?.jsonData as AppJsonData)?.apps ?? [];

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<FaroApp>({ name: '', url: '', serviceName: '' });
  const [addingNew, setAddingNew] = useState(false);
  const [newValues, setNewValues] = useState<FaroApp>({ name: '', url: '', serviceName: '' });
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

  const save = async (updated: FaroApp[]) => {
    setSaving(true);
    setError('');
    try {
      await getBackendSrv().post(`/api/plugins/${meta?.id}/settings`, {
        enabled: meta?.enabled ?? true,
        pinned: true,
        jsonData: { apps: updated },
      });
      window.location.reload();
    } catch (e) {
      console.error('Failed to save', e);
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const handleRemove = (index: number) => {
    save(apps.filter((_, i) => i !== index));
  };

  const handleEditSave = () => {
    if (!isValidUrl(editValues.url)) {
      setError('Please enter a valid URL including the protocol (e.g. https://myapp.com)');
      return;
    }
    if (!editValues.serviceName.trim()) {
      setError('Service name is required');
      return;
    }
    save(apps.map((app, i) => (i === editIndex ? editValues : app)));
  };

  const handleAddSave = () => {
    if (!isValidUrl(newValues.url)) {
      setError('Please enter a valid URL including the protocol (e.g. https://myapp.com)');
      return;
    }
    if (!newValues.serviceName.trim()) {
      setError('Service name is required');
      return;
    }
    const appName = newValues.name.trim() || new URL(newValues.url).hostname;
    save([...apps, { ...newValues, name: appName }]);
  };

  const lokiField = (values: FaroApp, onChange: (v: FaroApp) => void) => (
    <Field label="Loki datasource" description="If not set, the first available Loki datasource is used">
      <Combobox
        width={50}
        placeholder="Select a Loki datasource"
        options={lokiDatasources}
        value={values.lokiUid || null}
        onChange={(v) => onChange({ ...values, lokiUid: v?.value ?? undefined })}
        isClearable
      />
    </Field>
  );

  const tempoField = (values: FaroApp, onChange: (v: FaroApp) => void) => (
    <Field label="Tempo datasource" description="Enables the Traces page to open queries in Explore">
      <Combobox
        width={50}
        placeholder="Select a Tempo datasource"
        options={tempoDatasources}
        value={values.tempoUid || null}
        onChange={(v) => onChange({ ...values, tempoUid: v?.value ?? undefined })}
        isClearable
      />
    </Field>
  );

  return (
    <div className={s.wrapper}>
      <Stack direction="column" gap={4}>
        <Stack direction="column" gap={1}>
          <Text element="h1" variant="h2">
            Settings
          </Text>
          <Text color="secondary">Manage your monitored applications.</Text>
        </Stack>

        {error && <Text color="error">{error}</Text>}

        <Stack direction="column" gap={2}>
          {apps.map((app, i) => (
            <div key={i} className={s.appRow}>
              {editIndex === i ? (
                <Stack direction="column" gap={2}>
                  <Field label="App URL" invalid={Boolean(error && !editValues.url)} error={error}>
                    <Input
                      width={50}
                      value={editValues.url}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setEditValues({ ...editValues, url: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Service name">
                    <Input
                      width={50}
                      value={editValues.serviceName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setEditValues({ ...editValues, serviceName: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Display name">
                    <Input
                      width={50}
                      value={editValues.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setEditValues({ ...editValues, name: e.target.value })
                      }
                    />
                  </Field>
                  {lokiField(editValues, setEditValues)}
                  {tempoField(editValues, setEditValues)}
                  <Stack direction="row" gap={1}>
                    <Button onClick={handleEditSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditIndex(null);
                        setError('');
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="column" gap={0}>
                    <Text variant="body">{app.name}</Text>
                    <Text color="secondary" variant="bodySmall">
                      {app.url}
                    </Text>
                    <Text color="secondary" variant="bodySmall">
                      Service: {app.serviceName}
                    </Text>
                    {app.lokiUid && (
                      <Text color="secondary" variant="bodySmall">
                        Loki: {lokiDatasources.find((t) => t.value === app.lokiUid)?.label ?? app.lokiUid}
                      </Text>
                    )}
                    {app.tempoUid && (
                      <Text color="secondary" variant="bodySmall">
                        Tempo: {tempoDatasources.find((t) => t.value === app.tempoUid)?.label ?? app.tempoUid}
                      </Text>
                    )}
                  </Stack>
                  <Stack direction="row" gap={1}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditIndex(i);
                        setEditValues(app);
                        setError('');
                        setAddingNew(false);
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleRemove(i)} disabled={saving}>
                      Remove
                    </Button>
                  </Stack>
                </Stack>
              )}
            </div>
          ))}
        </Stack>

        {addingNew ? (
          <div className={s.appRow}>
            <Stack direction="column" gap={2}>
              <Text variant="h5">Add app</Text>
              <Field label="App URL" invalid={Boolean(error && !newValues.url)} error={error}>
                <Input
                  width={50}
                  placeholder="https://myapp.com"
                  value={newValues.url}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewValues({ ...newValues, url: e.target.value })}
                />
              </Field>
              <Field
                label="Service name"
                description={
                  <>
                    Must match the <code>app.name</code> you set in Faro
                  </>
                }
              >
                <Input
                  width={50}
                  placeholder="my-app"
                  value={newValues.serviceName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewValues({ ...newValues, serviceName: e.target.value })
                  }
                />
              </Field>
              <Field label="Display name" description="Optional — defaults to the hostname if left blank">
                <Input
                  width={50}
                  placeholder="My App"
                  value={newValues.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewValues({ ...newValues, name: e.target.value })}
                />
              </Field>
              {lokiField(newValues, setNewValues)}
              {tempoField(newValues, setNewValues)}
              <Stack direction="row" gap={1}>
                <Button onClick={handleAddSave} disabled={!newValues.url || !newValues.serviceName || saving}>
                  {saving ? 'Saving...' : 'Add app'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAddingNew(false);
                    setError('');
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </div>
        ) : (
          <div>
            <Button
              variant="secondary"
              icon="plus"
              onClick={() => {
                setAddingNew(true);
                setEditIndex(null);
                setError('');
                setNewValues({ name: '', url: '', serviceName: '' });
              }}
            >
              Add app
            </Button>
          </div>
        )}
      </Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    padding: ${theme.spacing(4, 2)};
    max-width: 640px;
  `,
  appRow: css`
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
  `,
});
