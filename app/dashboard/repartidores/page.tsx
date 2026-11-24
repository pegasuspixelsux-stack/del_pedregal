'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useDrivers } from '@/src/hooks/useDrivers';
import { createDriver, deleteDriver, updateDriver } from '@/src/services/dbService';
import type { Driver } from '@/src/types/firestore';
import { PageHeader, cardClass, inputClass, labelClass } from '@/src/components/dashboard/ui';

const empty = { name: '', phone: '', zone: '', route: '', active: true };

export default function DriversPage() {
  const { agent } = useAuth();
  const isAdmin = agent?.role === 'admin';
  const { drivers, loading, error, reload } = useDrivers();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const startEdit = (d: Driver) => {
    setEditing(d.id);
    setForm({ name: d.name, phone: d.phone, zone: d.zone, route: d.route, active: d.active });
    setMessage(null);
  };
  const cancel = () => {
    setEditing(null);
    setForm(empty);
  };

  const fail = (err: unknown, fallback: string) => {
    const denied = (err as { code?: string }).code === 'permission-denied';
    setMessage({ ok: false, text: denied ? 'Permiso denegado. Solo los administradores pueden gestionar repartidores (y las reglas de Firestore deben estar publicadas).' : fallback });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name.trim(), phone: form.phone.trim(), zone: form.zone.trim(), route: form.route.trim(), active: form.active };
    if (!data.name) {
      setMessage({ ok: false, text: 'Ingresá el nombre del repartidor.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      if (editing) await updateDriver(editing, data);
      else await createDriver(data);
      setMessage({ ok: true, text: editing ? 'Repartidor actualizado.' : `Se agregó a ${data.name}.` });
      cancel();
      await reload();
    } catch (err) {
      fail(err, 'No se pudo guardar el repartidor.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (d: Driver) => {
    setMessage(null);
    try {
      await deleteDriver(d.id);
      setMessage({ ok: true, text: `Se eliminó a ${d.name}. Sus pedidos quedan como “Repartidor eliminado”; para conservar el historial, mejor desactivalo.` });
      await reload();
    } catch (err) {
      fail(err, 'No se pudo eliminar el repartidor.');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Entregas"
        title="Repartidores"
        description="Cada repartidor con su zona y su ruta. Asigná los pedidos desde Pedidos y sacá el reporte de ventas por repartidor en Reportes."
        action={
          <Link href="/dashboard/reports" className="inline-flex items-center gap-2 bg-white border border-[#000000]/5 text-xs font-medium px-5 py-3 rounded-full hover:bg-[#F5F5F7]">
            <BarChart3 className="w-4 h-4" /> Reporte de ventas
          </Link>
        }
      />

      {isAdmin && (
        <form onSubmit={onSubmit} className={`${cardClass} p-6 mb-6 grid sm:grid-cols-2 gap-4 max-w-3xl`}>
          <div>
            <label htmlFor="dr-name" className={labelClass}>Nombre</label>
            <input id="dr-name" className={inputClass} maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="dr-phone" className={labelClass}>Teléfono / WhatsApp</label>
            <input id="dr-phone" className={inputClass} maxLength={50} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label htmlFor="dr-zone" className={labelClass}>Zona</label>
            <input id="dr-zone" className={inputClass} maxLength={120} placeholder="Ej. Punta del Este" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm pb-3">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Activo (se le pueden asignar pedidos)
            </label>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="dr-route" className={labelClass}>Ruta</label>
            <textarea id="dr-route" rows={3} className={`${inputClass} resize-y`} maxLength={1000} placeholder="Ej. Lunes y jueves: La Barra → Manantiales → José Ignacio" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336] disabled:opacity-50">
              <Plus className="w-4 h-4" /> {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar repartidor'}
            </button>
            {editing && (
              <button type="button" onClick={cancel} className="text-xs text-[#515154] underline">Cancelar</button>
            )}
          </div>
        </form>
      )}

      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`text-sm mb-4 ${message.ok ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>
      )}
      {error && <p role="alert" className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-[#515154]">Cargando repartidores…</p>
      ) : drivers.length === 0 ? (
        <div className={`${cardClass} p-10 text-center text-sm text-[#515154]`}>
          Todavía no hay repartidores.{isAdmin ? ' Agregá el primero arriba.' : ''}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {drivers.map((d) => (
            <div key={d.id} className={`${cardClass} p-5 flex flex-col gap-3 ${d.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-semibold tracking-tight truncate">{d.name}</h2>
                  <p className="text-xs text-[#515154]">{d.phone || 'Sin teléfono'}{d.active ? '' : ' · Inactivo'}</p>
                </div>
                {isAdmin && (
                  <div className="flex shrink-0">
                    <button type="button" onClick={() => startEdit(d)} aria-label={`Editar ${d.name}`} className="p-2 rounded-full hover:bg-[#F5F5F7]">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => onDelete(d)} aria-label={`Eliminar ${d.name}`} className="p-2 rounded-full text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm"><span className="text-[#515154]">Zona: </span>{d.zone || '—'}</p>
              <p className="text-sm whitespace-pre-line"><span className="text-[#515154]">Ruta: </span>{d.route || '—'}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
