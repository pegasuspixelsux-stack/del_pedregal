'use client';

import { Suspense, useState, useMemo } from 'react';
import type { HomeProperty } from '@/src/lib/homeData';
import SiteHeader from '@/src/components/SiteHeader';
import SiteFooter from '@/src/components/SiteFooter';
import InfoSections from '@/src/components/InfoSections';
import CatalogSection from '@/src/components/CatalogSection';
import { useClient } from '@/src/context/ClientContext';
import { applyBoxFirst, applyLevel } from '@/src/utils/pricing';
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
  const allowLoose = client?.allowLoose ?? false;
  const properties = useMemo(() => applyBoxFirst(applyLevel(baseProperties, level), level, allowLoose), [baseProperties, level, allowLoose]);

  return (
    <div className="min-h-screen bg-[#FBFBFD] max-md:bg-[#172554] text-[#1D1D1F] selection:bg-[#000000] selection:text-[#FFFFFF] font-sans antialiased">

      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-0 md:max-w-none md:px-0 md:pt-0">
        <section data-home-hero className="relative w-full h-screen h-[100svh] md:h-screen flex flex-col items-center justify-start max-md:rounded-none md:rounded-none overflow-hidden rounded-3xl border-0 bg-[radial-gradient(circle_at_50%_40%,#3b82f6_0%,#1d4ed8_45%,#1e3a8a_100%)] text-white">
          {/* Bottom shade: deeper blue toward the bottom edge */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#172554] to-transparent" />
          {/* Phones: one centered column (logo, bottles, text) that fits between the top bar and the bottom nav; the bottles take
              whatever space is left, so nothing overlaps. Tablet and desktop: two columns, the text block on the left and the
              bottles on the right. */}
          <div className="relative w-full h-full flex flex-col items-center gap-3 px-5 text-center pt-[calc(5.5rem+env(safe-area-inset-top))] pb-[calc(8rem+env(safe-area-inset-bottom))] md:flex-row md:justify-between md:gap-10 md:px-12 lg:px-24 md:text-left md:pt-[10rem] md:pb-8">
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
