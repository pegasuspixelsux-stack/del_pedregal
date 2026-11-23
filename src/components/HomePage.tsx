'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import type { HomeProperty } from '@/src/lib/homeData';
import SiteFooter from '@/src/components/SiteFooter';
import InfoSections from '@/src/components/InfoSections';
import CatalogSection from '@/src/components/CatalogSection';
import FitText from '@/src/components/FitText';
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


/** Hero subheading style. */
const HERO_TEXT_CLASS =
  'text-left mt-2 max-md:mt-1 md:mt-1.5 max-w-2xl max-md:w-full max-md:max-w-sm text-[17px] max-md:text-[15px] max-md:leading-[1.35] max-md:tracking-[-0.022em] md:text-base text-white/95 font-normal leading-relaxed';

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
        <section data-home-hero className="relative w-full h-screen h-[100svh] flex flex-col items-center justify-start max-md:rounded-none overflow-hidden rounded-3xl border-0 bg-[radial-gradient(circle_at_50%_40%,#ef4444_0%,#b91c1c_45%,#7f1d1d_100%)] max-md:bg-[radial-gradient(circle_at_50%_40%,#3b82f6_0%,#1d4ed8_45%,#1e3a8a_100%)] text-white">
          {/* Bottom shade: deeper red toward the bottom edge */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#450a0a] max-md:from-[#172554] to-transparent" />
          {/* Desktop only: the logo on the right column, over the overlay */}
            {/* Phones: brand block, centered in the hero's flow (8pt spacing scale: 8 / 16 / 32) */}
            <div className="relative w-full h-1/2 max-md:h-full max-md:items-center max-md:pt-14 justify-center px-5 md:px-10 pt-[clamp(16px,4svh,32px)] max-md:pb-[max(24px,env(safe-area-inset-bottom))] pb-[max(clamp(16px,4svh,32px),env(safe-area-inset-bottom))] flex flex-col items-start text-left md:pt-9 md:pb-9 md:landscape:max-xl:pt-7 md:landscape:max-xl:pb-7 md:portrait:pt-7 md:portrait:pb-7">
            <span className="max-md:hidden block w-fit max-md:mt-0 md:inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase">
              {business.heroEyebrow || 'Distribución hortifrutícola B2B'}
            </span>
            {/* Phones: logo (white version of the blue artwork) instead of the heading */}
            <h1 className="md:hidden self-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-delpedregal.png" alt="Del Pedregal" fetchPriority="high" decoding="async" className="mx-auto h-auto w-[min(40vw,162px)] brightness-0 invert drop-shadow-lg" />
            </h1>
            <h1 className="max-md:hidden mt-4 text-left self-start font-semibold tracking-tight leading-[0.85]">
              <span className="block text-[clamp(52px,18vw,260px)] font-extrabold leading-[0.8] tracking-[-0.04em]">Mercado</span>
              <span className="block text-[clamp(52px,18vw,260px)] font-extrabold leading-[0.8] tracking-[-0.04em] mt-[0.1em]">de Carnes</span>
            </h1>
            {/* Phones: bottles, directly under the logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Dosbidones-tapa-azul.png" fetchPriority="high" decoding="async" alt="" aria-hidden="true" className="md:hidden pointer-events-none relative -translate-y-[10%] mt-4 h-[40svh] w-auto max-w-[90%] object-contain drop-shadow-2xl" />
            <div className="max-md:hidden">
              {business.heroText ? (
                <p className={HERO_TEXT_CLASS}>{business.heroText}</p>
              ) : (
                <FitText as="p" className={HERO_TEXT_CLASS} min={11} max={20}>
                  Abastecimiento directo para comercios y gastronomía.
                </FitText>
              )}
            </div>
            {/* Phones: supporting text right below the bottles */}
            <p className="md:hidden relative -translate-y-[5svh] mt-3 max-w-[17rem] text-balance text-center text-[15px] leading-[1.35] tracking-[-0.022em] text-white/95">
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
