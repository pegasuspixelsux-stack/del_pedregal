'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getLeadsBetween } from '@/src/services/dbService';
import { useDrivers } from '@/src/hooks/useDrivers';
import type { Lead, LeadStatus } from '@/src/types/firestore';
import { dayKey, groupOrders, orderNumberOf, orderTotal, withoutPartialOrder, type OrderGroup } from '@/src/utils/orders';
import { bucketKeyOf, bucketsOf, periodLabels, periodOf, shiftRef, type PeriodKind } from '@/src/utils/reportPeriods';
import { formatMoney } from '@/src/utils/format';
import { cardClass, inputClass, labelClass } from '@/src/components/dashboard/ui';
import { orderStatusLabels, orderStatusStyles } from '@/src/components/dashboard/OrderModal';

const LIMIT = 5000;
const KINDS: PeriodKind[] = ['day', 'week', 'month', 'year'];
const STATUSES: LeadStatus[] = ['new', 'contacted', 'closed', 'completed'];

const clientKeyOf = (g: OrderGroup) => g.primary.clientId || `name:${g.primary.clientName.trim().toLowerCase()}`;
const driverKeyOf = (g: OrderGroup) => g.lines.find((l) => l.driverId)?.driverId ?? 'none';
const clientNameOf = (g: OrderGroup) => g.primary.clientName.trim() || 'Sin nombre';

interface Loaded {
  key: string;
  leads: Lead[];
  error: string | null;
}

/** "Reportes": the clients' orders for a day, week, month or year, with totals, a per-client table and a CSV export. */
export default function Reports() {
  const [kind, setKind] = useState<PeriodKind>('week');
  const [ref, setRef] = useState(() => dayKey(Date.now()));
  const [client, setClient] = useState('all');
  const [driver, setDriver] = useState('all');
  const { drivers, nameFor } = useDrivers();
  const [statuses, setStatuses] = useState<Set<LeadStatus>>(new Set(STATUSES));
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const period = useMemo(() => periodOf(kind, ref), [kind, ref]);
  const requestKey = `${period.start}-${period.end}`;

  useEffect(() => {
    let cancelled = false;
    getLeadsBetween(period.start, period.end, LIMIT)
      .then((leads) => !cancelled && setLoaded({ key: requestKey, leads, error: null }))
      .catch(
        (e) =>
          !cancelled &&
          setLoaded({ key: requestKey, leads: [], error: e instanceof Error ? e.message : 'No se pudieron cargar los pedidos.' }),
      );
    return () => {
      cancelled = true;
    };
  }, [period.start, period.end, requestKey]);

  const loading = loaded?.key !== requestKey;
  const truncated = !loading && (loaded?.leads.length ?? 0) >= LIMIT;

  const allOrders = useMemo(
    () => groupOrders(withoutPartialOrder(loaded?.key === requestKey ? loaded.leads : [], LIMIT)),
    [loaded, requestKey],
  );

  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of allOrders) map.set(clientKeyOf(g), clientNameOf(g));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [allOrders]);

  const orders = useMemo(
    () => allOrders.filter(
        (g) =>
          statuses.has(g.status) &&
          (client === 'all' || clientKeyOf(g) === client) &&
          (driver === 'all' || driverKeyOf(g) === driver),
      ),
    [allOrders, statuses, client, driver],
  );

  const totals = useMemo(() => {
    const total = orders.reduce((s, g) => s + orderTotal(g.lines), 0);
    return {
      orders: orders.length,
      lines: orders.reduce((s, g) => s + g.lines.length, 0),
      total,
      average: orders.length ? total / orders.length : 0,
    };
  }, [orders]);

  const byClient = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; lines: number; total: number }>();
    for (const g of orders) {
      const k = clientKeyOf(g);
      const row = map.get(k) ?? { name: clientNameOf(g), orders: 0, lines: 0, total: 0 };
      row.orders += 1;
      row.lines += g.lines.length;
      row.total += orderTotal(g.lines);
      map.set(k, row);
    }
    return [...map.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.total - a.total);
  }, [orders]);

  const byDriver = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; lines: number; total: number }>();
    for (const g of orders) {
      const k = driverKeyOf(g);
      const row = map.get(k) ?? { name: nameFor(k === 'none' ? undefined : k), orders: 0, lines: 0, total: 0 };
      row.orders += 1;
      row.lines += g.lines.length;
      row.total += orderTotal(g.lines);
      map.set(k, row);
    }
    return [...map.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.total - a.total);
  }, [orders, nameFor]);

  const buckets = useMemo(() => {
    const defs = bucketsOf(kind, period);
    const sums = new Map<string, { orders: number; total: number }>();
    for (const g of orders) {
      const k = bucketKeyOf(kind, g.createdAt);
      const row = sums.get(k) ?? { orders: 0, total: 0 };
      row.orders += 1;
      row.total += orderTotal(g.lines);
      sums.set(k, row);
    }
    const rows = defs.map((b) => ({ ...b, ...(sums.get(b.key) ?? { orders: 0, total: 0 }) }));
    return { rows, max: Math.max(0, ...rows.map((r) => r.total)) };
  }, [orders, kind, period]);

  const toggleStatus = (s: LeadStatus) =>
    setStatuses((cur) => {
      const next = new Set(cur);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const decimal = (n: number) => n.toFixed(2).replace('.', ',');
    const header = ['Pedido', 'Fecha', 'Cliente', 'Teléfono', 'Repartidor', 'Estado', 'Productos', 'Total'];
    const body = orders.map((g) => [
      orderNumberOf(g),
      new Date(g.createdAt).toLocaleString('es-UY'),
      clientNameOf(g),
      g.primary.phone,
      nameFor(driverKeyOf(g) === 'none' ? undefined : driverKeyOf(g)),
      orderStatusLabels[g.status],
      g.lines.length,
      decimal(orderTotal(g.lines)),
    ]);
    const csv = '﻿' + [header, ...body].map((r) => r.map(esc).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-pedidos-${kind}-${dayKey(period.start)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const th = 'text-left text-xs uppercase tracking-wider font-semibold text-[#515154] px-5 py-3';
  const td = 'px-5 py-3 text-sm';
  const tdNum = `${td} text-right tabular-nums`;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className={`${cardClass} p-5 space-y-5`}>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <span className={labelClass}>Período</span>
            <div role="group" aria-label="Tipo de período" className="inline-flex rounded-full bg-[#F5F5F7] p-1">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  aria-pressed={kind === k}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${kind === k ? 'bg-[#1D1D1F] text-white' : 'text-[#515154] hover:bg-[#E8E8ED]'}`}
                >
                  {periodLabels[k]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="report-date" className={labelClass}>
              {kind === 'day' ? 'Fecha' : 'Cualquier fecha del período'}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRef(shiftRef(kind, ref, -1))}
                aria-label="Período anterior"
                className="h-11 w-11 rounded-full bg-[#F5F5F7] flex items-center justify-center hover:bg-[#E8E8ED]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                id="report-date"
                type="date"
                value={ref}
                onChange={(e) => e.target.value && setRef(e.target.value)}
                className={`${inputClass} w-auto`}
              />
              <button
                type="button"
                onClick={() => setRef(shiftRef(kind, ref, 1))}
                aria-label="Período siguiente"
                className="h-11 w-11 rounded-full bg-[#F5F5F7] flex items-center justify-center hover:bg-[#E8E8ED]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="min-w-48">
            <label htmlFor="report-client" className={labelClass}>
              Cliente
            </label>
            <select id="report-client" value={client} onChange={(e) => setClient(e.target.value)} className={inputClass}>
              <option value="all">Todos los clientes</option>
              {clients.map(([k, name]) => (
                <option key={k} value={k}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-48">
            <label htmlFor="report-driver" className={labelClass}>
              Repartidor
            </label>
            <select id="report-driver" value={driver} onChange={(e) => setDriver(e.target.value)} className={inputClass}>
              <option value="all">Todos los repartidores</option>
              <option value="none">Sin asignar</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!orders.length}
            className="sm:ml-auto inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] text-white px-5 py-3 text-sm font-medium hover:bg-[#333336] disabled:opacity-40 transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
        <div>
          <span className={labelClass}>Estados incluidos</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Estados incluidos">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                aria-pressed={statuses.has(s)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-opacity ${orderStatusStyles[s].chip} ${statuses.has(s) ? '' : 'opacity-30'}`}
              >
                {orderStatusLabels[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm font-medium capitalize">{period.label}</p>

      {loaded?.error ? (
        <p role="alert" className="text-sm text-red-600">
          {loaded.error}
        </p>
      ) : loading ? (
        <p className="text-sm text-[#515154]">Cargando pedidos…</p>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Pedidos', String(totals.orders)],
              ['Productos', String(totals.lines)],
              ['Total vendido', formatMoney(totals.total)],
              ['Pedido promedio', formatMoney(totals.average)],
            ].map(([label, value]) => (
              <div key={label} className={`${cardClass} p-5`}>
                <p className="text-xs uppercase tracking-wider font-semibold text-[#515154]">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          {/* By driver */}
          <section className={`${cardClass} overflow-x-auto`} aria-label="Por repartidor">
            <h2 className="px-5 pt-5 text-lg font-semibold tracking-tight">Por repartidor</h2>
            {byDriver.length ? (
              <table className="w-full mt-3">
                <thead>
                  <tr className="border-b border-[#000000]/5">
                    <th className={th}>Repartidor</th>
                    <th className={`${th} text-right`}>Pedidos</th>
                    <th className={`${th} text-right`}>Productos</th>
                    <th className={`${th} text-right`}>Total vendido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#000000]/5">
                  {byDriver.map((r) => (
                    <tr key={r.key}>
                      <td className={`${td} font-medium`}>{r.name}</td>
                      <td className={tdNum}>{r.orders}</td>
                      <td className={tdNum}>{r.lines}</td>
                      <td className={`${tdNum} font-semibold`}>{formatMoney(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-5 text-sm text-[#515154]">No hay pedidos en este período.</p>
            )}
          </section>

          {/* By client */}
          <section className={`${cardClass} overflow-x-auto`} aria-label="Por cliente">
            <h2 className="px-5 pt-5 text-lg font-semibold tracking-tight">Por cliente</h2>
            {byClient.length ? (
              <table className="w-full mt-3">
                <thead>
                  <tr className="border-b border-[#000000]/5">
                    <th className={th}>Cliente</th>
                    <th className={`${th} text-right`}>Pedidos</th>
                    <th className={`${th} text-right`}>Productos</th>
                    <th className={`${th} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#000000]/5">
                  {byClient.map((r) => (
                    <tr key={r.key}>
                      <td className={`${td} font-medium`}>{r.name}</td>
                      <td className={tdNum}>{r.orders}</td>
                      <td className={tdNum}>{r.lines}</td>
                      <td className={`${tdNum} font-semibold`}>{formatMoney(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-5 text-sm text-[#515154]">No hay pedidos en este período.</p>
            )}
          </section>

          {/* By day / month */}
          {kind !== 'day' && (
            <section className={`${cardClass} overflow-x-auto`} aria-label={kind === 'year' ? 'Por mes' : 'Por día'}>
              <h2 className="px-5 pt-5 text-lg font-semibold tracking-tight">{kind === 'year' ? 'Por mes' : 'Por día'}</h2>
              <table className="w-full mt-3">
                <thead>
                  <tr className="border-b border-[#000000]/5">
                    <th className={th}>{kind === 'year' ? 'Mes' : 'Día'}</th>
                    <th className={`${th} text-right`}>Pedidos</th>
                    <th className={`${th} text-right`}>Total</th>
                    <th className={`${th} w-1/3 hidden sm:table-cell`}>
                      <span className="sr-only">Gráfico</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#000000]/5">
                  {buckets.rows.map((r) => (
                    <tr key={r.key}>
                      <td className={`${td} capitalize`}>{r.label}</td>
                      <td className={tdNum}>{r.orders}</td>
                      <td className={`${tdNum} font-semibold`}>{formatMoney(r.total)}</td>
                      <td className={`${td} hidden sm:table-cell`}>
                        <div className="h-2 rounded-full bg-[#F5F5F7]">
                          <div
                            className="h-2 rounded-full bg-[#1e3a8a]"
                            style={{ width: `${buckets.max ? (r.total / buckets.max) * 100 : 0}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Orders */}
          <section className={`${cardClass} overflow-x-auto`} aria-label="Pedidos">
            <h2 className="px-5 pt-5 text-lg font-semibold tracking-tight">Pedidos</h2>
            {orders.length ? (
              <table className="w-full mt-3">
                <thead>
                  <tr className="border-b border-[#000000]/5">
                    <th className={th}>Pedido</th>
                    <th className={th}>Fecha</th>
                    <th className={th}>Cliente</th>
                    <th className={th}>Repartidor</th>
                    <th className={th}>Estado</th>
                    <th className={`${th} text-right`}>Productos</th>
                    <th className={`${th} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#000000]/5">
                  {orders.map((g) => (
                    <tr key={g.key}>
                      <td className={`${td} whitespace-nowrap`}>{orderNumberOf(g)}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {new Date(g.createdAt).toLocaleString('es-UY', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className={`${td} font-medium`}>{clientNameOf(g)}</td>
                      <td className={td}>{nameFor(driverKeyOf(g) === 'none' ? undefined : driverKeyOf(g))}</td>
                      <td className={td}>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${orderStatusStyles[g.status].chip}`}>
                          {orderStatusLabels[g.status]}
                        </span>
                      </td>
                      <td className={tdNum}>{g.lines.length}</td>
                      <td className={`${tdNum} font-semibold`}>{formatMoney(orderTotal(g.lines))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-5 text-sm text-[#515154]">No hay pedidos con estos filtros.</p>
            )}
          </section>
          {truncated && (
            <p className="text-xs text-[#86868B]">
              Se muestran los {LIMIT} productos más recientes del período; los más viejos no entran en el reporte.
            </p>
          )}
          <p className="text-xs text-[#86868B]">
            Los totales suman los productos de cada pedido; no incluyen envío ni impuestos. La fecha es la del momento en que se hizo el pedido.
          </p>
        </>
      )}
    </div>
  );
}
