'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, House, LayoutGrid, ShoppingCart } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';

/**
 * Bottom navigation for phones: Inicio, Productos, Favoritos and Carrito, on every page (the CSS in globals.css shows it
 * below 768px only: `.app-bottom-nav`). It also covers the installed app (home-screen icon), which has no browser toolbar.
 * A floating rounded bar of icons; the current page is shown by a green icon, with no filled background.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { count, setOpen } = useCart();

  const tab = (active: boolean) =>
    `relative flex flex-1 items-center justify-center min-h-11 rounded-full transition-colors duration-200 active:scale-90 ${
      active ? 'text-[#1e3a8a]' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
    }`;
  const icon = (active: boolean) => `w-6 h-6 transition-transform duration-200 ${active ? 'scale-110 [stroke-width:2.4]' : ''}`;

  // The Open Graph flyer is a single full screen shared on WhatsApp: no app navigation on top of it.
  if (pathname.startsWith('/opengraph')) return null;

  const home = pathname === '/';
  const catalog = false;
  const favorites = pathname.startsWith('/favoritos');

  return (
    <nav
      aria-label="Navegación de la app"
      className="app-bottom-nav fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 gap-1 rounded-full border border-[#000000]/10 bg-white p-1.5 shadow-xl shadow-black/15"
    >
      <Link href="/" aria-label="Inicio" title="Inicio" className={tab(home)} aria-current={home ? 'page' : undefined}>
        <House className={icon(home)} aria-hidden="true" />
      </Link>
      <Link
        href="/#catalog"
        aria-label="Productos"
        title="Productos"
        className={tab(catalog)}
        aria-current={catalog ? 'page' : undefined}
        onClick={(e) => {
          // Already on the homepage: slide the hero up and bring the products into view (the catalog section does the same after a page change).
          if (pathname === '/') {
            e.preventDefault();
            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
            history.replaceState(null, '', '/#catalog');
          }
        }}
      >
        <LayoutGrid className={icon(catalog)} aria-hidden="true" />
      </Link>
      <Link href="/favoritos" aria-label="Favoritos" title="Favoritos" className={tab(favorites)} aria-current={favorites ? 'page' : undefined}>
        <Heart className={icon(favorites)} aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Abrir carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`}
        title="Carrito"
        className={tab(false)}
      >
        <span className="relative">
          <ShoppingCart className={icon(false)} aria-hidden="true" />
          {count > 0 && (
            <span className="absolute -top-2 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-[#1e3a8a] text-white text-[10px] font-semibold flex items-center justify-center">
              {count}
            </span>
          )}
        </span>
      </button>
    </nav>
  );
}
