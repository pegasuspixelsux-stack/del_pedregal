'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, House, LayoutGrid, ShoppingCart } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';

/**
 * Bottom navigation for phones: Inicio, Productos, Favoritos and Carrito, on every page (the CSS in globals.css shows it
 * below 768px only: `.app-bottom-nav`). It also covers the installed app (home-screen icon), which has no browser toolbar.
 * A floating rounded bar of icons; the current page is shown by a green icon, with no filled background.
 */
/** Luminance (0 dark .. 1 light) of the first opaque background colour found at a point on the page, ignoring `skip`. */
function backgroundLuminanceAt(x: number, y: number, skip: Element): number {
  for (const el of document.elementsFromPoint(x, y)) {
    if (skip.contains(el)) continue;
    for (let node: Element | null = el; node; node = node.parentElement) {
      const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(node).backgroundColor);
      if (!m) continue;
      const [r, g, b, a = '1'] = m[1].split(',').map((v) => parseFloat(v));
      if (Number(a) < 0.5) continue;
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    }
  }
  return 1;
}

export default function BottomNav() {
  const pathname = usePathname();
  const { count, setOpen } = useCart();
  const navRef = useRef<HTMLElement>(null);
  // The bar is a transparent blurred box: icons are white over blue / dark areas and black over white / light ones.
  const [onDark, setOnDark] = useState(true);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const nav = navRef.current;
      if (!nav) return;
      const box = nav.getBoundingClientRect();
      setOnDark(backgroundLuminanceAt(box.left + box.width / 2, box.top + box.height / 2, nav) < 0.55);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const t = window.setTimeout(schedule, 400); // after the page content has rendered
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(t);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [pathname]);

  const tab = (active: boolean) =>
    `relative flex flex-1 items-center justify-center min-h-11 rounded-full transition-colors duration-200 active:scale-90 ${
      onDark
        ? active ? 'text-white' : 'text-white/65 hover:text-white'
        : active ? 'text-black' : 'text-black/55 hover:text-black'
    }`;
  const icon = (active: boolean) => `w-6 h-6 transition-transform duration-200 ${active ? 'scale-110 [stroke-width:2.4]' : ''}`;

  // The Open Graph flyer is a single full screen shared on WhatsApp: no app navigation on top of it.
  if (pathname.startsWith('/opengraph')) return null;

  const home = pathname === '/';
  const catalog = false;
  const favorites = pathname.startsWith('/favoritos');

  return (
    <nav
      ref={navRef}
      aria-label="Navegación de la app"
      className={`app-bottom-nav fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 gap-1 rounded-full border bg-white/20 p-1.5 backdrop-blur-xl transition-colors duration-300 ${onDark ? 'border-white/30' : 'border-black/10'}`}
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
            <span className="absolute -top-2 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-[#1e3a8a] text-white ring-2 ring-white/70 text-[10px] font-semibold flex items-center justify-center">
              {count}
            </span>
          )}
        </span>
      </button>
    </nav>
  );
}
