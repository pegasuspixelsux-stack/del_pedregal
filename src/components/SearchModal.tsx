'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

const fieldClass =
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-3 py-3 text-base md:text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] transition-colors';
const labelClass = 'block text-[11px] uppercase tracking-wider font-semibold text-[#515154] mb-1.5';

/**
 * Advanced search: text, category, availability, price range and sorting. "Buscar" opens the catalog with those
 * filters applied (it reads them from the URL: /?q=…&category=…&availability=…&min=…&max=…&sort=…).
 */
export default function SearchModal({
  open,
  onClose,
  categories,
  initialQuery = '',
}: {
  open: boolean;
  onClose: () => void;
  categories: { id: string; label: string }[];
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [sort, setSort] = useState('relevance');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start from what is already typed on the page
    setQuery(initialQuery);
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // the page behind does not scroll
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose, initialQuery]);

  if (!open) return null;

  const clear = () => {
    setQuery('');
    setCategory('all');
    setAvailability('all');
    setMin('');
    setMax('');
    setSort('relevance');
    input.current?.focus();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category !== 'all') params.set('category', category);
    if (availability !== 'all') params.set('availability', availability);
    if (min.trim()) params.set('min', min.trim());
    if (max.trim()) params.set('max', max.trim());
    if (sort !== 'relevance') params.set('sort', sort);
    const qs = params.toString();
    onClose();
    router.push(qs ? `/?${qs}#catalog` : '/#catalog');
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center px-3 pt-[max(12px,env(safe-area-inset-top))] pb-3 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Búsqueda avanzada" className="relative w-full max-w-lg bg-white text-[#1D1D1F] rounded-3xl shadow-2xl p-5 md:p-7 my-auto">
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F5F5F7]">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold tracking-tight pr-10">Búsqueda avanzada</h2>
        <p className="text-sm text-[#515154] font-light mt-1 mb-5">Filtrá el catálogo por nombre, categoría, stock o precio.</p>

        <form onSubmit={submit} role="search" className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-[#FBFBFD] border border-[#000000]/10 px-3 focus-within:border-[#1D1D1F] transition-colors">
            <Search className="w-4 h-4 text-[#515154] shrink-0" aria-hidden="true" />
            <input
              ref={input}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscá por nombre, categoría o precio…"
              aria-label="Buscar productos"
              className="min-w-0 flex-1 bg-transparent py-3 text-base md:text-sm outline-none placeholder:text-[#86868B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="sm-category" className={labelClass}>Categoría</label>
              <select id="sm-category" value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
                <option value="all">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="sm-availability" className={labelClass}>Disponibilidad</label>
              <select id="sm-availability" value={availability} onChange={(e) => setAvailability(e.target.value)} className={fieldClass}>
                <option value="all">Todos</option>
                <option value="in-stock">Solo en stock</option>
                <option value="on-sale">En oferta</option>
              </select>
            </div>
            <div>
              <label htmlFor="sm-min" className={labelClass}>Precio mínimo</label>
              <input id="sm-min" type="number" inputMode="decimal" min={0} value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="sm-max" className={labelClass}>Precio máximo</label>
              <input id="sm-max" type="number" inputMode="decimal" min={0} value={max} onChange={(e) => setMax(e.target.value)} placeholder="Sin límite" className={fieldClass} />
            </div>
            <div className="col-span-2">
              <label htmlFor="sm-sort" className={labelClass}>Ordenar por</label>
              <select id="sm-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={fieldClass}>
                <option value="relevance">Más recientes</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre: A–Z</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={clear} className="h-12 px-5 rounded-full bg-[#F5F5F7] text-sm font-medium hover:bg-[#E8E8ED] active:scale-95 transition">
              Borrar
            </button>
            <button type="submit" className="flex-1 h-12 rounded-full bg-[#1e3a8a] text-white text-base md:text-sm font-semibold hover:bg-[#1e40af] active:scale-95 transition inline-flex items-center justify-center gap-2">
              <Search className="w-4 h-4" /> Buscar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
