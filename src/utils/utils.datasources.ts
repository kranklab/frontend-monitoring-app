import { useEffect, useState } from 'react';
import { getBackendSrv } from '@grafana/runtime';

export type DatasourceOption = { label: string; value: string };

function useDatasourcesByType(type: string): DatasourceOption[] {
  const [options, setOptions] = useState<DatasourceOption[]>([]);

  useEffect(() => {
    getBackendSrv()
      .get('/api/datasources')
      .then((datasources: Array<{ uid: string; name: string; type: string }>) => {
        setOptions(datasources.filter((ds) => ds.type === type).map((ds) => ({ label: ds.name, value: ds.uid })));
      })
      .catch(() => {});
  }, [type]);

  return options;
}

export function useLokiDatasources() {
  return useDatasourcesByType('loki');
}

export function useTempoDatasources() {
  return useDatasourcesByType('tempo');
}
