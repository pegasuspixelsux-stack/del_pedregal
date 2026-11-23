'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import type { HomeProperty } from '@/src/lib/homeData';
import SiteFooter from '@/src/components/SiteFooter';
import InfoSections from '@/src/components/InfoSections';
import CatalogSection from '@/src/components/CatalogSection';
import CartButton from '@/src/components/CartButton';
import WholesaleAccess from '@/src/components/WholesaleAccess';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import { useClient } from '@/src/context/ClientContext';
import { applyBoxFirst, applyLevel } from '@/src/utils/pricing';
import HomeAccessButton from '@/src/components/HomeAccessButton';
import BrandName from '@/src/components/BrandName';
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
  const allowLoose = client?.allowLoose ?? false;
  const properties = useMemo(() => applyBoxFirst(applyLevel(baseProperties, level), level, allowLoose), [baseProperties, level, allowLoose]);

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
          <span aria-hidden="true" />
        </div>
      </header>

      {/* --- NAVIGATION --- */}
      <header className="hidden md:block sticky top-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-md">
        <div className="bg-[#b91c1c] text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 sm:px-6 leading-snug">
          <span>Entregas diarias en Maldonado y Punta del Este</span>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-sm min-[420px]:text-base sm:text-lg tracking-tight"><BrandName /></span>
          <SiteNavLinks />
          <div className="flex items-center gap-1">
          <WholesaleAccess />
          <CartButton />
          <MobileNavMenu />
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-0 md:px-6 pt-0 md:pt-4">
        <section data-home-hero className="relative w-full h-screen h-[100svh] flex flex-col items-center justify-start max-md:rounded-none overflow-hidden rounded-3xl border-0 bg-[radial-gradient(circle_at_50%_40%,#3b82f6_0%,#1d4ed8_45%,#1e3a8a_100%)] text-white">
          {/* Bottom shade: deeper blue toward the bottom edge */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#172554] to-transparent" />
          {/* Logo, bottles and supporting text: one centered column that fits between the top bar and the bottom nav
              (padding reserves their height), the bottles taking whatever space is left, so nothing overlaps on any phone or tablet. */}
          <div className="relative w-full h-full flex flex-col items-center gap-3 px-5 text-center pt-[calc(5.5rem+env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] md:gap-4 md:pt-8 md:pb-8">
            <h1 className="shrink-0">
              {/* White version of the blue logo artwork */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-delpedregal.png" alt="Del Pedregal" fetchPriority="high" decoding="async" className="mx-auto h-auto w-[min(45vw,183px)] md:w-[min(22vw,260px)] brightness-0 invert drop-shadow-lg" />
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Dosbidones-tapa-azul.png" fetchPriority="high" decoding="async" alt="" aria-hidden="true" className="pointer-events-none min-h-0 flex-1 w-full max-w-[90%] max-h-[60svh] object-contain drop-shadow-2xl" />
            <p className="shrink-0 max-w-[17rem] md:max-w-md text-balance text-[15px] md:text-lg leading-[1.35] tracking-[-0.022em] text-white/95">
              {business.heroText || 'Abastecimiento directo para comercios y gastronomía.'}
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
