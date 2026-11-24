'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDrivers } from '../services/dbService';
import type { Driver } from '../types/firestore';

/** Delivery drivers (staff only). `nameFor` falls back for drivers that were deleted. */
export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setDrivers(await getDrivers());
      setError(null);
    } catch {
      setError('No se pudieron cargar los repartidores. Revisá que las reglas de Firestore estén publicadas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    void reload();
  }, [reload]);

  const byId = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);
  const nameFor = useCallback((id?: string) => (id ? (byId.get(id)?.name ?? 'Repartidor eliminado') : 'Sin asignar'), [byId]);

  return { drivers, loading, error, reload, nameFor };
}
