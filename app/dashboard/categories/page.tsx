'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus, Trash2 } from 'lucide-react';
import { useProperties } from '@/src/hooks/useProperties';
import { useCategories } from '@/src/hooks/useCategories';
import { PageHeader, cardClass, inputClass } from '@/src/components/dashboard/ui';
import { resetCategories } from '@/src/services/dbService';
import { DEFAULT_CATEGORY_NAME } from '@/src/utils/format';

export default function CategoriesPage() {
  const { items, loading, error, hasMore } = useProperties(100, true);
  const { categories, add, remove, reload, error: categoriesError } = useCategories();
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await add(name);
      setMessage({ ok: true, text: `Se agregó “${name.trim()}”.` });
      setName('');
    } catch (err) {
      const code = (err as { code?: string }).code;
      setMessage({
        ok: false,
        text:
          code === 'permission-denied'
            ? 'Permiso denegado. Revisá que las reglas de Firestore estén publicadas.'
            : err instanceof Error
              ? err.message
              : 'No se pudo agregar la categoría.',
      });
    } finally {
      setSaving(false);
    }
  };

  const onReset = async () => {
    setResetting(true);
    setMessage(null);
    try {
      const r = await resetCategories();
      await reload();
      setMessage({
        ok: r.failedProducts.length === 0,
        text:
          `Listo: se eliminaron ${r.deletedCategories} categorías y ${r.movedProducts} productos pasaron a “${DEFAULT_CATEGORY_NAME}”.` +
          (r.failedProducts.length ? ` No se pudieron mover: ${r.failedProducts.join(', ')}.` : ''),
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      setMessage({
        ok: false,
        text: code === 'permission-denied' ? 'Permiso denegado. Iniciá sesión como administrador.' : 'No se pudieron reiniciar las categorías.',
      });
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  const onDelete = async (id: string, label: string) => {
    setMessage(null);
    try {
      await remove(id);
      setMessage({ ok: true, text: `Se eliminó “${label}”.` });
    } catch {
      setMessage({ ok: false, text: 'No se pudo eliminar la categoría.' });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Categorías"
        description="Agrupá tus productos. Podés agregar categorías propias; las predeterminadas no se pueden eliminar."
      />

      <form onSubmit={onAdd} className="flex flex-wrap items-center gap-3 mb-6 max-w-xl">
        <label htmlFor="cat-name" className="sr-only">Nombre de la nueva categoría</label>
        <input
          id="cat-name"
          className={`${inputClass} flex-1 min-w-48`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Nueva categoría, ej. Hierbas"
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {saving ? 'Agregando…' : 'Agregar categoría'}
        </button>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => (confirmReset ? void onReset() : setConfirmReset(true))}
          disabled={resetting}
          className="text-xs font-medium px-5 py-3 rounded-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {resetting ? 'Reiniciando…' : confirmReset ? 'Confirmar: borrar todas y mover productos' : `Reiniciar categorías (solo “${DEFAULT_CATEGORY_NAME}”)`}
        </button>
        {confirmReset && !resetting && (
          <button type="button" onClick={() => setConfirmReset(false)} className="text-xs text-[#515154] underline">Cancelar</button>
        )}
      </div>

      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`text-sm mb-4 ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
      {(error || categoriesError) && (
        <p role="alert" className="text-sm text-red-600 mb-4">{error ?? categoriesError}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {categories.map((c) => {
          const count = items.filter((p) => p.type === c.id).length;
          // Only block deleting when we can be sure the category is used by a loaded item.
          const inUse = count > 0;
          return (
            <div key={c.id} className={`${cardClass} group relative p-5 md:p-6 flex flex-col justify-between min-h-36`}>
              <Link
                href={`/dashboard/productos?category=${c.id}`}
                className="absolute inset-0 rounded-2xl"
                aria-label={`Ver productos de ${c.name}`}
              />
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold tracking-tight">{c.name}</h2>
                <ArrowUpRight className="w-4 h-4 text-[#515154] group-hover:text-[#1D1D1F] shrink-0" />
              </div>
              <div className="flex items-end justify-between gap-2">
                <p className="text-sm text-[#515154]">
                  <span className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                    {loading ? '–' : `${count}${hasMore ? '+' : ''}`}
                  </span>{' '}
                  {count === 1 && !hasMore ? 'producto' : 'productos'}
                </p>
                {!c.builtin && (
                  <button
                    type="button"
                    onClick={() => onDelete(c.id, c.name)}
                    disabled={inUse}
                    aria-label={inUse ? `${c.name} no se puede eliminar mientras tenga productos` : `Eliminar ${c.name}`}
                    title={inUse ? 'Primero movés o eliminás sus productos' : 'Eliminar categoría'}
                    className="relative z-10 p-2 rounded-full text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
