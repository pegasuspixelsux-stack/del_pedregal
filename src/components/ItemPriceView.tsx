'use client';

import { useClient } from '@/src/context/ClientContext';
import { boxDescription, optionPrice, saleOptions, type SaleSource } from '@/src/utils/pricing';
import { formatMoney, pricingModeLabels, pricingSuffix } from '@/src/utils/format';

/**
 * Price display for one item, one card per way of buying it.
 * Logged-out visitors (minorista) see kilo / unidad at the list price; a wholesale customer sees
 * caja / unidad at their level's price (list price × the category adjustment %), with a badge naming the level.
 * Logging out reverts at once.
 */
export default function ItemPriceView({ pricing, categoryId, glass }: { pricing: SaleSource; categoryId?: string; glass?: boolean }) {
  const { client, level } = useClient();
  const wholesale = !!(client && level);
  const allOptions = saleOptions(pricing, wholesale ? 'wholesale' : 'retail', { allowLoose: client?.allowLoose });
  // Minorista sees the price per kilo, mayorista the price per caja (when the item has that way of selling).
  const preferred = allOptions.filter((o) => o.mode === (wholesale ? 'por_caja' : 'por_kilo'));
  const options = preferred.length ? preferred : allOptions;
  const box = boxDescription(pricing);
  const boxOption = options.find((o) => o.mode === 'por_caja');
  // Wholesale customers only: what a case holds and costs, in small text under the per-kilo price. It comes from the item's
  // configuration (box weight / units / box price in the dashboard), at the customer's level price.
  const caseOption = saleOptions(pricing, 'wholesale', { allowLoose: true }).find((o) => o.mode === 'por_caja');
  const casePrice = caseOption ? optionPrice(caseOption, categoryId, wholesale ? level : null).unit : undefined;
  // "Caja de 18 kg · $2.160 por caja": what the case holds (kilos or units) and its price, from the item's configuration.
  const caseLine = wholesale && casePrice !== undefined ? `${box || 'Caja'} · ${formatMoney(casePrice)} por caja` : null;
  // glass: no box background, light text, for use over the mobile hero photo
  const card = glass ? 'text-[#1D1D1F]' : 'bg-white border border-[#000000]/5';
  const muted = 'text-[#515154]';

  return (
    <dl className={`grid ${glass ? 'grid-cols-1' : 'grid-cols-2'} gap-3 w-full max-w-2xl`}>
      {options.map((o) => {
        const { unit, was } = optionPrice(o, categoryId, wholesale ? level : null);
        return (
          <div key={o.mode} className={`${options.length === 1 && !glass ? 'col-span-2' : ''} rounded-2xl ${card} ${glass ? 'p-0' : 'p-4 md:p-5'}`}>
            <dt className={`text-xs uppercase tracking-wider ${muted} font-semibold`}>
              {wholesale ? 'Tu precio' : 'Minorista'} · {o.mode === 'por_unidad' ? 'Unidad' : pricingModeLabels[o.mode]}
            </dt>
            <dd className={`mt-1 flex ${glass ? 'flex-col items-end' : 'flex-wrap items-baseline gap-x-2'}`}>
              <span className="flex items-baseline gap-1.5">
                <span className={`text-xs font-semibold ${muted}`}>{pricingSuffix(o.mode).replace('/', '').trim()}</span>
                <span className="text-2xl font-extrabold tracking-tight">{formatMoney(unit).replace('$', 'UYU$')}</span>
              </span>
              {glass && caseLine && <span className={`text-[11px] leading-snug ${muted} text-right`}>{caseLine}</span>}
              {glass ? (
                <span className="flex items-center justify-end gap-2">
                  {wholesale && level && <span className="bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Precio {level.name}</span>}
                  {!wholesale && o.salePrice !== undefined && <span className="bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Oferta</span>}
                  {was !== undefined && <s className="text-sm text-[#86868B]">{formatMoney(was)}</s>}
                </span>
              ) : (
                was !== undefined && <s className="text-sm text-[#86868B]">{formatMoney(was)}</s>
              )}
            </dd>
            {!glass && caseLine && <p className={`mt-1 text-[11px] leading-snug ${muted}`}>{caseLine}</p>}
            {o.mode === 'por_caja' && pricing.boxUnits && boxOption && (
              <p className={`mt-1 text-[11px] ${muted} ${glass ? 'text-right' : ''}`}>
                {formatMoney(Math.round((unit / pricing.boxUnits) * 100) / 100)} por {pricing.pricingMode === 'por_atado' ? 'atado' : 'unidad'}
              </p>
            )}
            {!glass && !wholesale && o.salePrice !== undefined && (
              <span className="inline-block mt-2 bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Oferta</span>
            )}
          </div>
        );
      })}

      {wholesale && level ? (
        glass ? null : <div className="col-span-2">
          <span className="inline-block bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Precio {level.name}
          </span>
        </div>
      ) : null}
    </dl>
  );
}
