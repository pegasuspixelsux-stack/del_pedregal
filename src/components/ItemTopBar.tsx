'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import CartButton from '@/src/components/CartButton';
import WholesaleAccess from '@/src/components/WholesaleAccess';
import SearchModal from '@/src/components/SearchModal';
import { useCategories } from '@/src/hooks/useCategories';

// Same look as the bottom icon bar (BottomNav): white rounded bar, thin border, soft shadow, grey icons.
const pill = 'flex items-center gap-1 rounded-full border border-[#000000]/10 bg-white p-1 text-[#6E6E73] shadow-xl shadow-black/15';

/** Top bar of the item page: burger on the left, title in the center, search and cart on the right. */
export default function ItemTopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const { categories } = useCategories();

  return (
    <div className="max-w-[1440px] mx-auto px-6 h-16 pt-[env(safe-area-inset-top)] box-content md:pt-0 md:box-border flex items-center justify-between">
      <div className={pill}>
        <MobileNavMenu align="left" always />
      </div>
      <Link href="/" aria-label="Del Pedregal, inicio" className="shrink-0">
        {/* White version over the photo on phones; the original blue on the light desktop bar. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/image_bottles/logo-delpedregal.png" alt="Del Pedregal" className="h-14 w-auto brightness-0 invert drop-shadow md:brightness-100 md:invert-0 md:drop-shadow-none" />
      </Link>
      <div className={pill}>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Buscar"
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center hover:bg-[#F5F5F7] transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
        <CartButton />
      </div>
      {/* Not shown: it only owns the client login dialog that "Ingresar como cliente" opens (the dialog renders in a portal). */}
      <div className="hidden"><WholesaleAccess /></div>
      <SearchModal open={searchOpen} onClose={closeSearch} categories={categories.map((c) => ({ id: c.id, label: c.name }))} />
    </div>
  );
}
