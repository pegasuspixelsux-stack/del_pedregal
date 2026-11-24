'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/src/context/AuthContext';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

const inputClass =
  'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60';
const labelClass = 'block text-xs uppercase tracking-wider font-semibold text-white/60 mb-2';

export default function AdminLoginPage() {
  const router = useRouter();
  const { agent, loading, error, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && agent) router.replace('/dashboard');
  }, [loading, agent, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? 'unknown';
      console.error('Sign-in failed:', err);
      setFormError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
          ? 'Correo o contraseña incorrectos.'
          : code === 'auth/operation-not-allowed'
            ? 'El inicio de sesión con correo y contraseña no está habilitado en Firebase (Authentication → Sign-in method).'
            : code === 'auth/too-many-requests'
              ? 'Demasiados intentos. Esperá unos minutos y probá de nuevo.'
              : code === 'auth/network-request-failed'
                ? 'Error de red al conectar con Firebase.'
                : `No se pudo iniciar sesión (${code}).`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    setFormError(null);
    setNotice(null);
    if (!email.trim()) {
      setFormError('Ingresá tu correo arriba y después hacé clic en “¿Olvidaste tu contraseña?”.');
      return;
    }
    if (!auth) return;
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch {
      // Don't reveal whether the account exists.
    }
    setNotice('Si existe una cuenta con ese correo, te va a llegar un enlace para restablecer la contraseña.');
  };

  const message = formError ?? error;

  return (
    <main
      className="relative min-h-screen overflow-hidden text-white"
      // Deep blue radial background, like the hero
      style={{
        backgroundColor: '#172554',
        backgroundImage: 'radial-gradient(circle at 30% 45%, #2563eb 0%, #1d4ed8 35%, #172554 100%)',
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#172554]/30 via-transparent to-[#172554]/60" />
      {/* Brand, top-left corner */}
      <Link
        href="/"
        className="absolute top-8 left-8 z-20 text-lg font-semibold tracking-tight drop-shadow"
      >
        Agua Del Pedregal
      </Link>

      {/* Version, bottom-left corner */}
      <p className="absolute bottom-8 left-8 z-20 text-xs font-medium tracking-wide text-white/80 drop-shadow">
        Agua Del Pedregal
      </p>

      {/* Wide screens held landscape: two columns (left transparent, right 50% black). Phones and portrait tablets: one column. */}
      <div className="relative min-h-screen grid grid-cols-1 md:landscape:grid-cols-2">
        {/* Wide screens: the 20 L bottle (cut out, zoomed out) over a blurred radial glow, on the open (left) side */}
        <div aria-hidden="true" className="relative hidden md:landscape:flex items-center justify-center p-12">
          <div className="absolute h-[62vh] w-[62vh] rounded-full bg-[radial-gradient(circle,#93c5fd_0%,#3b82f6_40%,transparent_70%)] opacity-80 blur-3xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image_bottles/bidon-20l-cut.webp" alt="" className="relative max-h-[50vh] w-auto max-w-full object-contain drop-shadow-2xl" />
        </div>

        <div className="bg-[#172554]/30 md:landscape:bg-[#172554]/50 flex items-center justify-center px-6 py-24">
          <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-white/60 font-semibold mb-2">Agua Del Pedregal</p>
            <h1 className="text-2xl font-semibold tracking-tight mb-1">Iniciar sesión</h1>
            <p className="text-sm text-white/70 font-light mb-8">Administrá productos, pedidos y usuarios.</p>

            {!isFirebaseConfigured && (
              <p className="mb-6 text-xs rounded-xl bg-amber-400/20 text-amber-100 p-3">
                Firebase todavía no está configurado. Copiá <code>.env.local.example</code> a <code>.env.local</code>,
                completá las claves de tu proyecto y reiniciá el servidor.
              </p>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className={labelClass}>Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="text-xs uppercase tracking-wider font-semibold text-white/60">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs text-white/70 hover:text-white underline underline-offset-2"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              {message && <p role="alert" className="text-xs text-red-300">{message}</p>}
              {notice && <p role="status" className="text-xs text-green-300">{notice}</p>}
              <button
                type="submit"
                disabled={submitting || !isFirebaseConfigured}
                className="w-full bg-white text-black py-3.5 rounded-xl text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50"
              >
                {submitting ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>

            <Link href="/" className="block text-center text-xs text-white/70 hover:text-white mt-6">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
