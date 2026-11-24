'use client';

import { Suspense, useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { HomeProperty } from '@/src/lib/homeData';
import SiteFooter from '@/src/components/SiteFooter';
import InfoSections from '@/src/components/InfoSections';
import CatalogSection from '@/src/components/CatalogSection';
import CartButton from '@/src/components/CartButton';
import WholesaleAccess from '@/src/components/WholesaleAccess';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import SearchModal from '@/src/components/SearchModal';
import { Search } from 'lucide-react';
import { typeLabels } from '@/src/utils/format';
import { useClient } from '@/src/context/ClientContext';
import { applyBoxFirst, applyLevel } from '@/src/utils/pricing';
import HomeAccessButton from '@/src/components/HomeAccessButton';
import { useBusiness } from '@/src/context/BusinessContext';



// The built-in samples now come from the server (loadHomeData falls back to src/data/sampleProperties.ts).
const fallbackProperties: HomeProperty[] = [];


export default function FrescoHome({
  initialProperties = [],
}: {
  /** Active properties loaded on the server; the built-in samples show if there are none. */
  initialProperties?: HomeProperty[];
}) {
  // The built-in samples open /productos/sample-N, which the item page fills from the same sample data.
  const [baseProperties] = useState<HomeProperty[]>(
    initialProperties.length
      ? initialProperties
      : fallbackProperties.map((p) => ({ ...p, href: `/productos/sample-${p.id}` })),
  );
  // A customer who logged in with Acceso mayoristas sees their price level; everyone else sees list prices.
  const { client, level } = useClient();
  const business = useBusiness();
  // Phone top nav: transparent over the hero, blurred and tinted once the page scrolls.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // Search window (the icon at the right of the top nav).
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const allowLoose = client?.allowLoose ?? false;
  const properties = useMemo(() => applyBoxFirst(applyLevel(baseProperties, level), level, allowLoose), [baseProperties, level, allowLoose]);
  // One category per type that has items, in the order they first appear.
  const categories = Array.from(
    new Map(
      properties
        .filter((p) => p.type)
        .map((p) => [p.type as string, p.typeLabel ?? typeLabels[p.type as string] ?? (p.type as string)]),
    ),
    ([id, label]) => ({ id, label }),
  );

  return (
    <div className="min-h-screen bg-[#FBFBFD] max-md:bg-[#172554] text-[#1D1D1F] selection:bg-[#000000] selection:text-[#FFFFFF] font-sans antialiased">

      {/* --- PHONE TOP NAV: burger on the left; search and "add to home screen" on the right --- */}
      <header
        className={`md:hidden fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-[background-color] duration-300 ${
          scrolled ? 'bg-[color-mix(in_srgb,#1e3a8a_72%,transparent)]' : 'bg-transparent'
        }`}
      >
        <div className="bg-[#1e3a8a] text-white text-center text-[11px] font-medium tracking-wide py-1.5 px-4 leading-snug pt-[calc(0.375rem+env(safe-area-inset-top))]">
          <span>Entregas diarias en Maldonado y Punta del Este</span>
        </div>
        <div className="h-14 px-3 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
          <MobileNavMenu bare align="left" />
          <div className="flex justify-center min-w-0">
            <HomeAccessButton onDark noModal />
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Búsqueda avanzada"
            title="Búsqueda avanzada"
            className="w-10 h-10 shrink-0 flex items-center justify-center text-white drop-shadow hover:opacity-80 active:scale-90 transition"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={closeSearch} categories={categories} initialQuery="" />

      {/* --- NAVIGATION --- */}
      <header
        className={`nav-on-blue hidden md:block fixed inset-x-0 top-0 z-50 text-white backdrop-blur-md transition-[background-color] duration-300 ${
          scrolled ? 'bg-[color-mix(in_srgb,#1e3a8a_80%,transparent)]' : 'bg-transparent'
        }`}
      >
        <div className="bg-[#1e3a8a] text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 sm:px-6 leading-snug">
          <span>Entregas diarias en Maldonado y Punta del Este</span>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 pt-4 min-h-16 flex items-center justify-between">
          {/* Logo on the left (white version of the blue artwork) */}
          <Link href="/" aria-label="Del Pedregal, inicio" className="justify-self-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image_bottles/logo-nav.webp" alt="Del Pedregal" width={503} height={232} className="h-16 w-auto brightness-0 invert drop-shadow" />
          </Link>
          <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Búsqueda avanzada"
            title="Búsqueda avanzada"
            className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center hover:bg-[#F5F5F7] transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <WholesaleAccess />
          <CartButton />
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-0 md:max-w-none md:px-0 md:pt-0">
        <section data-home-hero className="relative w-full h-screen h-[100svh] md:h-screen flex flex-col items-center justify-start max-md:rounded-none md:rounded-none overflow-hidden rounded-3xl border-0 bg-[radial-gradient(circle_at_50%_40%,#3b82f6_0%,#1d4ed8_45%,#1e3a8a_100%)] text-white">
          {/* Bottom shade: deeper blue toward the bottom edge */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#172554] to-transparent" />
          {/* Phones: one centered column (logo, bottles, text) that fits between the top bar and the bottom nav; the bottles take
              whatever space is left, so nothing overlaps. Tablet and desktop: two columns, the text block on the left and the
              bottles on the right. */}
          <div className="relative w-full h-full flex flex-col items-center gap-3 px-5 text-center pt-[calc(5.5rem+env(safe-area-inset-top))] pb-[calc(8rem+env(safe-area-inset-bottom))] md:flex-row md:justify-between md:gap-10 md:px-12 lg:px-24 md:text-left md:pt-[9rem] md:pb-8">
            <h1 className="sr-only md:hidden">Del Pedregal Acceso Mayorista</h1>
            {/* Phones: white version of the blue logo artwork */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-delpedregal.png" alt="Del Pedregal" fetchPriority="high" decoding="async" className="md:hidden shrink-0 relative -translate-y-[10%] mx-auto h-auto w-[min(45vw,183px)] brightness-0 invert drop-shadow-lg" />

            {/* Tablet and desktop: left column */}
            <div className="hidden md:flex md:w-1/2 flex-col items-start gap-5">
              <span className="inline-block w-fit rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase">
                {business.heroEyebrow || 'Agua mineral natural'}
              </span>
              <h1 className="max-w-[11em] text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight leading-[1.08] text-balance">
                {business.heroHeading || 'La pureza del agua mineral natural, directamente en tu negocio.'}
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-white/95">
                {business.heroText || 'Abastecimiento directo, continuo y sin intermediarios para restaurantes, hoteles y comercios.'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#catalog"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white text-[#1e3a8a] text-sm font-semibold shadow-lg hover:scale-[1.03] active:scale-95 transition"
                >
                  Ver productos
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-white/60 text-white text-sm font-semibold hover:bg-white/15 active:scale-95 transition"
                >
                  Acceso mayorista
                </a>
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Dosbidones-tapa-azul.png" fetchPriority="high" decoding="async" alt="" aria-hidden="true" className="pointer-events-none -mt-8 md:mt-0 min-h-0 flex-1 w-full max-w-[90%] max-h-[60svh] object-contain drop-shadow-2xl md:flex-none md:w-1/2 md:max-w-none md:h-full md:max-h-[72svh]" />

            {/* Phones: supporting text below the bottles */}
            <p className="md:hidden shrink-0 max-w-[17rem] text-balance text-[15px] leading-[1.35] tracking-[-0.022em] text-white/95">
              {business.heroText || 'Abastecimiento directo, continuo y sin intermediarios para restaurantes, hoteles y comercios.'}
            </p>
          </div>
        </section>
      </div>

      {/* --- BODY: one section after the hero: the full catalog --- */}
      <Suspense fallback={null}>
        <CatalogSection items={properties} />
      </Suspense>

      <InfoSections />

      <SiteFooter />

    </div>
  );
}
