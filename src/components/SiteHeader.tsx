'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import CartButton from '@/src/components/CartButton';
import WholesaleAccess from '@/src/components/WholesaleAccess';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import SearchModal from '@/src/components/SearchModal';
import HomeAccessButton from '@/src/components/HomeAccessButton';
import { typeLabels } from '@/src/utils/format';

const SIZE_CATEGORIES = Object.entries(typeLabels).map(([id, label]) => ({ id, label }));

/**
 * The site's top navigation, shared by the homepage and the product pages: a blue stripe, then (phones) burger, access
 * button and search, or (tablet / desktop) logo on the left with search, access and cart on the right.
 * Default: laid over the hero, transparent until the page scrolls. `solid`: a sticky bar on a solid blue background,
 * for pages whose content is light (product pages).
 */
export default function SiteHeader({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  useEffect(() => {
    if (solid) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [solid]);

  const position = solid ? 'sticky' : 'fixed';
  const tint = (alpha: number) => (solid || scrolled ? `bg-[color-mix(in_srgb,#1e3a8a_${alpha}%,transparent)]` : 'bg-transparent');
  const solidBg = solid ? 'bg-[#1e3a8a]' : '';

  return (
    <>
      {/* --- PHONE TOP NAV: burger on the left; search and "add to home screen" on the right --- */}
      <header
        className={`md:hidden ${position} inset-x-0 top-0 z-50 backdrop-blur-md transition-[background-color] duration-300 ${solid ? solidBg : tint(72)}`}
      >
        <div className="bg-black text-white text-center text-[11px] font-medium tracking-wide py-1.5 px-4 leading-snug pt-[calc(0.375rem+env(safe-area-inset-top))]">
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

      <SearchModal open={searchOpen} onClose={closeSearch} categories={SIZE_CATEGORIES} initialQuery="" />

      {/* --- NAVIGATION --- */}
      <header
        className={`nav-on-blue hidden md:block ${position} inset-x-0 top-0 z-50 text-white backdrop-blur-md transition-[background-color] duration-300 ${solid ? solidBg : tint(80)}`}
      >
        <div className="bg-black text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 sm:px-6 leading-snug">
          <span>Entregas diarias en Maldonado y Punta del Este</span>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 pt-4 pb-4 min-h-16 flex items-center justify-between">
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
    </>
  );
}
