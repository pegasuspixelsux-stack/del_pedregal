'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PropertyImage from '@/src/components/PropertyImage';
import FavoriteButton from '@/src/components/FavoriteButton';

export interface SimilarItem {
  id: string;
  title: string;
  image: string;
  /** Formatted regular price. */
  price: string;
  /** Formatted sale price, when on sale. */
  salePrice?: string;
  /** e.g. "12 lb". */
  quantity: string;
  inStock: boolean;
}

/** "$ 540 / kg" -> { unit: "kg", amount: "UYU$ 540" }: the item page's price style (small unit first, then the price). */
function splitPrice(formatted: string): { unit: string; amount: string } {
  const m = /^(.*?)\s*(?:\/\s*)?(kg|por \S+)$/.exec(formatted.trim());
  if (!m) return { unit: '', amount: formatted.replace('$', 'UYU$') };
  return { unit: m[2].replace(/^por /, ''), amount: m[1].replace('$', 'UYU$') };
}

/** Horizontal slider of other items; swipe on touch screens, arrows on desktop. */
export default function SimilarItems({ title, items, embedded = false }: { title: string; items: SimilarItem[]; embedded?: boolean }) {
  const track = useRef<HTMLUListElement>(null);
  if (items.length === 0) return null;

  const scroll = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <section
      aria-label={title}
      className={embedded ? 'w-full' : 'max-w-[1440px] mx-auto px-6 pt-4 md:pt-0 md:-mt-14 pb-8 md:pb-10 max-md:bg-white max-md:mt-0 max-md:w-full max-md:rounded-b-3xl max-md:pb-10 max-md:mb-3'}
    >
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
        <div className="hidden md:flex gap-2">
          <button type="button" onClick={() => scroll(-1)} aria-label="Desplazar a la izquierda" className="w-10 h-10 rounded-full bg-white border border-[#000000]/5 flex items-center justify-center hover:bg-[#F5F5F7]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Desplazar a la derecha" className="w-10 h-10 rounded-full bg-white border border-[#000000]/5 flex items-center justify-center hover:bg-[#F5F5F7]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ul
        ref={track}
        className={`flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth ${embedded ? '-mx-3 px-3 md:mx-0 md:px-0 scroll-pl-3 md:scroll-pl-0' : '-mx-6 px-6 scroll-pl-6'} ${embedded ? '' : 'pb-2'} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {items.map((item) => (
          <li key={item.id} className={`snap-start shrink-0 ${embedded ? 'w-[40%] sm:w-[28%] md:w-[19%] lg:w-[15%]' : 'w-[60%] sm:w-[40%] md:w-[28%] lg:w-[22%]'}`}>
            <Link href={`/productos/${item.id}`} className="group relative block aspect-square rounded-2xl overflow-hidden bg-white border border-[#000000]/5">
              <PropertyImage
                src={item.image}
                alt={item.title}
                variant="card"
                sizes={embedded ? "(min-width: 1024px) 15vw, (min-width: 768px) 19vw, (min-width: 640px) 28vw, 40vw" : "(min-width: 1024px) 22vw, (min-width: 768px) 28vw, 60vw"}
                className={`object-contain px-4 pt-8 pb-20 md:px-6 md:pt-10 md:pb-24 transition-transform duration-500 group-hover:scale-105 ${item.inStock ? '' : 'opacity-50 grayscale'}`}
              />
              {!item.inStock && (
                <span className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">Sin stock</span>
              )}
              <FavoriteButton productId={item.id} title={item.title} className="absolute top-3 right-3 z-10 w-8 h-8" />
              {/* Text inside the card, over the photo */}
              <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 text-black">
                <h3 className="text-base md:text-lg font-semibold tracking-tight leading-tight line-clamp-2">{item.title}</h3>
                <p className="mt-1.5 text-xs md:text-sm flex flex-wrap items-end justify-between gap-x-2">
                  <span className="text-black/70 truncate">{item.quantity}</span>
                  <span className="max-w-full flex items-baseline gap-1.5">
                    {(() => {
                      const now = splitPrice(item.salePrice ?? item.price);
                      return (
                        <>
                          {now.unit && <span className="text-[10px] md:text-xs font-semibold text-black/70">{now.unit}</span>}
                          <span className="text-base md:text-lg font-extrabold tracking-tight">{now.amount}</span>
                          {item.salePrice && <s className="text-[11px] font-normal text-black/50">{splitPrice(item.price).amount}</s>}
                        </>
                      );
                    })()}
                  </span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
