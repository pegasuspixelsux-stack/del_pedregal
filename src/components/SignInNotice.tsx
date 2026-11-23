'use client';

import Link from 'next/link';
import { KeyRound } from 'lucide-react';

/** Event that WholesaleAccess listens to, so any page can open the client sign-in modal. */
export const OPEN_CLIENT_LOGIN = 'merkado:open-client-login';

/** Shown instead of the order form: Fresco is B2B, so only customers with a profile can order. */
export default function SignInNotice() {
  return (
    <div role="note" className="rounded-2xl bg-[#F5F5F7] px-5 py-4 text-sm space-y-3">
      <div className="space-y-1">
        <p className="font-medium">Para hacer un pedido ingresá como cliente.</p>
        <p className="text-[#515154] font-light">
          Los pedidos son solo para clientes con perfil. ¿Todavía no sos cliente?{' '}
          <Link href="/#contact" className="font-medium text-[#1D1D1F] underline underline-offset-2 hover:text-[#1e3a8a]">
            Solicitá tu acceso aquí
          </Link>
          . Tras la aprobación y la configuración del pago, Fresco te envía tu contraseña.
        </p>
        <p className="text-[#515154] font-light">
          Al ingresar, el precio se actualiza según el nivel de precios de tu cuenta.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_CLIENT_LOGIN))}
        className="w-full rounded-full bg-[#450a0a] text-white shadow-xl shadow-black/30 border border-[#000000]/10 p-1.5 hover:bg-[#5a1212] hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/40 active:scale-[0.98] transition duration-200"
      >
        <span className="flex min-h-11 items-center justify-center gap-2 text-sm font-medium">
          <KeyRound className="w-4 h-4" /> Ingresar como cliente
        </span>
      </button>
    </div>
  );
}
