'use client';

/** Kept for the logo upload in Ajustes (BusinessForm); the nav now shows the name as text. */
export const DEFAULT_LOGO = '/fresco_footer.png';

/**
 * "Agua Del Pedregal" for the top nav, in the hero heading style: two rows, extra bold, tight tracking and leading.
 * `onDark`: the nav sits on a dark photo on phones (item page), so phones get white text.
 * Inline content: put it inside the heading / link.
 */
export default function BrandName({ onDark = false }: { onDark?: boolean }) {
  return (
    <span
      aria-label="Agua Del Pedregal"
      className={`inline-flex flex-col align-middle text-left text-xl font-extrabold leading-[0.8] tracking-[-0.04em] ${
        onDark ? 'max-md:text-white md:text-[#1D1D1F]' : 'text-[#1D1D1F]'
      }`}
    >
      <span aria-hidden="true">Agua</span>
      <span aria-hidden="true" className="mt-[0.1em]">Del Pedregal</span>
    </span>
  );
}
