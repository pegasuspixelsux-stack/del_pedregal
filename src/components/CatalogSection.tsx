'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { groupByCategory } from '@/src/utils/group';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Heart, LogOut, Plus } from 'lucide-react';
import type { HomeProperty } from '@/src/lib/homeData';
import { typeLabels } from '@/src/utils/format';
import PropertyImage from '@/src/components/PropertyImage';
import { unitPriceOf } from '@/src/components/CartDrawer';
import { useCart } from '@/src/context/CartContext';
import FavoriteButton from '@/src/components/FavoriteButton';
import { useClient } from '@/src/context/ClientContext';
import { applyBoxFirst, applyLevel } from '@/src/utils/pricing';

const PAGE_SIZE = 12; // products per page

type Sort = 'relevance' | 'price-asc' | 'price-desc' | 'name';
type Availability = 'all' | 'in-stock' | 'on-sale';


/** Greeting for the hour of the day on the visitor's device. */
const greeting = () => {
  const h = new Date().getHours();
  return h >= 6 && h < 12 ? 'Buenos días' : h >= 12 && h < 20 ? 'Buenas tardes' : 'Buenas noches';
};

/** Page buttons: 1 … 4 5 6 … 9 (null = gap). */
function pageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}

/** The full catalog (search, filters, category pills, paged grid), shown inside the homepage. Filters come from the URL: /?q=…&category=…#catalog */
export default function CatalogSection({ items: baseItems, top }: { items: HomeProperty[]; top?: React.ReactNode }) {
  // A customer who opened their access link sees their price level; everyone else sees list prices.
  const { client, level, signOutClient, favorites } = useClient();
  const allowLoose = client?.allowLoose ?? false;
  const items = useMemo(() => applyBoxFirst(applyLevel(baseItems, level), level, allowLoose), [baseItems, level, allowLoose]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [availability, setAvailability] = useState<Availability>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<Sort>('relevance');
  const [page, setPage] = useState(1);

  // Links from the footer and the search window open the catalog already filtered: /?category=<id>&q=<search>#catalog.
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  useEffect(() => {
    const params = new URLSearchParams(paramsKey);
    const c = params.get('category');
    const q = params.get('q');
    const av = params.get('availability');
    const mn = params.get('min');
    const mx = params.get('max');
    const so = params.get('sort');
    if (!(c || q || av || mn || mx || so)) return;
    /* eslint-disable react-hooks/set-state-in-effect -- filters from the URL */
    setCategory(c ?? 'all');
    setQuery(q ?? '');
    setAvailability(av === 'in-stock' || av === 'on-sale' ? av : 'all');
    setMinPrice(mn && Number.isFinite(Number(mn)) ? mn : '');
    setMaxPrice(mx && Number.isFinite(Number(mx)) ? mx : '');
    setSort(so === 'price-asc' || so === 'price-desc' || so === 'name' ? so : 'relevance');
    setPage(1);
    /* eslint-enable react-hooks/set-state-in-effect */
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }, [paramsKey]);

  // Cart: shared with every page (see CartContext).
  const { add: addToCart } = useCart();

  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          items
            .filter((p) => p.type)
            .map((p) => [p.type as string, p.typeLabel ?? typeLabels[p.type as string] ?? (p.type as string)]),
        ),
        ([id, label]) => ({ id, label }),
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);
    const list = items.filter((p) => {
      if (q) {
        const haystack = [p.title, p.typeLabel ?? typeLabels[p.type as string] ?? p.type, p.price, p.salePrice]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (category !== 'all' && p.type !== category) return false;
      if (availability === 'in-stock' && p.inStock === false) return false;
      if (availability === 'on-sale' && !(p.salePrice && p.inStock !== false)) return false;
      const price = unitPriceOf(p);
      if (min !== null && Number.isFinite(min) && price < min) return false;
      if (max !== null && Number.isFinite(max) && price > max) return false;
      return true;
    });
    if (sort === 'price-asc') list.sort((a, b) => unitPriceOf(a) - unitPriceOf(b));
    else if (sort === 'price-desc') list.sort((a, b) => unitPriceOf(b) - unitPriceOf(a));
    else if (sort === 'name') list.sort((a, b) => a.title.localeCompare(b.title, 'es'));
    return list;
  }, [items, query, category, availability, minPrice, maxPrice, sort]);

  const reset = () => {
    setQuery('');
    setCategory('all');
    setAvailability('all');
    setMinPrice('');
    setMaxPrice('');
    setSort('relevance');
    setPage(1);
  };

  // A filter change goes back to page 1; the page never exceeds the last one.
  const change =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  // 12 products per page; a filter change goes back to page 1.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const grouped = groupByCategory(filtered);
  const visible = grouped.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const goToPage = (n: number) => {
    setPage(n);
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* --- ALL PRODUCTS: 4-column grid --- */}
      <section id="catalog" className={`py-5 md:py-6 px-3 md:px-6 max-w-[1440px] mx-auto scroll-mt-20 bg-[#ECECF1] rounded-3xl max-md:mt-3 max-md:mb-2 md:mt-4 md:mb-16 md:w-[calc(100%-3rem)]`}>
        {top && <div className="mb-6">{top}</div>}

        {/* Signed-in customer: greeting with their favorites and a log-out button, above the search */}
        {client && level && (
          <div className="mb-6 flex flex-col items-center gap-2 text-center md:flex-row md:justify-between md:text-left">
            <p className="text-[clamp(24px,7.5vw,28px)] md:text-2xl font-semibold tracking-[-0.02em] leading-[1.15] text-[#1D1D1F] text-balance">
              {greeting()}, {(client.contactName || client.businessName).split(' ')[0]}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/favoritos"
                className="h-9 px-4 rounded-full bg-white text-[#1D1D1F] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#F5F5F7] active:scale-95 transition"
              >
                <Heart className="w-4 h-4" />
                Favoritos
                {favorites.length > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-[#1e3a8a] text-white text-[10px] font-semibold flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={signOutClient}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="w-9 h-9 shrink-0 rounded-full bg-white text-[#1D1D1F] flex items-center justify-center hover:bg-[#F5F5F7] active:scale-95 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <h2 className="mb-4 max-md:text-center text-2xl md:text-3xl font-semibold tracking-tight text-[#1D1D1F]">Nuestros Productos</h2>

        {/* Category buttons  */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Categorías"
              className="flex flex-1 min-w-0 flex-nowrap items-center gap-2 overflow-x-auto -ml-3 pl-3 md:mx-0 md:pl-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {[{ id: 'all', label: 'Todas' }, ...categories].map((c) => {
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => change(setCategory)(c.id)}
                    aria-pressed={active}
                    className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                      active ? 'bg-[#1e3a8a] text-white' : 'bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-[#515154] text-sm py-16">
              <p>No hay productos que coincidan con tu búsqueda.</p>
              <button type="button" onClick={reset} className="mt-3 font-medium text-[#1D1D1F] underline underline-offset-4">
                Borrar filtros
              </button>
            </div>
          )}
          {visible.map((prop) => {
            return (
            <Fragment key={String(prop.id)}>
            <div key={prop.id}>
            <div>
            <div
              className={`group relative aspect-square rounded-2xl overflow-hidden bg-[#E5E5EA] flex flex-col justify-end p-3 md:p-5 transition-transform duration-500 hover:-translate-y-1`}
            >
              <div className={`absolute inset-0 transition-transform duration-700 group-hover:scale-105 ${prop.inStock === false ? 'opacity-50 grayscale' : ''}`}>
                <PropertyImage
                  src={prop.image}
                  alt={prop.title}
                  variant="card"
                  sizes="(min-width: 768px) 25vw, 100vw"
                  className="object-contain px-6 pt-10 pb-24 md:px-8 md:pt-12 md:pb-28"
                />
              </div>
              {prop.href && (
                <Link href={prop.href} aria-label={`Ver ${prop.title}`} className="absolute inset-0 z-[5]" />
              )}
              <div className="absolute top-3 left-3 md:top-5 md:left-5 z-10 flex flex-wrap gap-1.5">
                {prop.inStock === false && (
                  <span className="bg-black/80 text-white text-[10px] md:text-xs font-semibold px-2 md:px-3 py-1 rounded-full">Sin stock</span>
                )}
              </div>

              <div className="absolute top-3 right-3 md:top-5 md:right-5 z-10 flex items-center gap-1.5">
                {typeof prop.id === 'string' && <FavoriteButton productId={prop.id} title={prop.title} className="w-8 h-8" />}
                <button
                  type="button"
                  onClick={() => addToCart(prop)}
                  disabled={prop.inStock === false}
                  aria-label={prop.inStock === false ? `${prop.title} está sin stock` : `Agregar ${prop.title} al carrito`}
                  className="w-8 h-8 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center shadow-sm hover:bg-[#1e40af] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-10 text-black pointer-events-none">
                <h2 className={`text-2xl mb-3 md:text-lg md:mb-3 font-semibold tracking-tight leading-tight`}>{prop.title}</h2>
                <div className={`flex flex-wrap items-end justify-between gap-x-2 text-lg md:text-sm font-medium`}>
                  <span className="text-black/70 truncate">{prop.area}</span>
                  <span className="max-w-full font-semibold">
                    {prop.salePrice ? (
                      <>
                        <s className="text-black/50 font-normal mr-1.5">{prop.price}</s>
                        {prop.salePrice}
                      </>
                    ) : (
                      prop.price
                    )}
                  </span>
                </div>
              </div>
            </div>
            </div>
            </div>
            </Fragment>
            );
          })}
        </div>

        {totalPages > 1 && (
          <nav aria-label="Páginas del catálogo" className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-11 px-4 rounded-full bg-white text-sm font-medium hover:bg-[#F5F5F7] disabled:opacity-40 transition-colors"
            >
              ← Anterior
            </button>
            {pageNumbers(currentPage, totalPages).map((n, i) =>
              n === null ? (
                <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-[#86868B]">…</span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => goToPage(n)}
                  aria-label={`Página ${n}`}
                  aria-current={n === currentPage ? 'page' : undefined}
                  className={`h-11 min-w-11 px-3 rounded-full text-sm font-medium transition-colors ${
                    n === currentPage ? 'bg-[#1e3a8a] text-white' : 'bg-white hover:bg-[#F5F5F7]'
                  }`}
                >
                  {n}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-11 px-4 rounded-full bg-white text-sm font-medium hover:bg-[#F5F5F7] disabled:opacity-40 transition-colors"
            >
              Siguiente →
            </button>
          </nav>
        )}

        {filtered.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-sm">
            <p className="justify-self-center md:justify-self-end text-xs text-[#515154]">
              Página {currentPage} de {totalPages} · {filtered.length} productos
            </p>
          </div>
        )}
      </section>

    </>
  );
}
