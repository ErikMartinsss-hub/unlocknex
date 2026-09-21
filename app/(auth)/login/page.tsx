'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GuestOnly } from '@/components/Guard';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';

function LoginForm() {
  const { login } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      push('Login realizado. Bem-vindo!', 'ok');
      router.replace('/dashboard');
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(
        code === 'auth/invalid-credential' || code === 'auth/user-not-found'
          ? 'E-mail ou senha inválidos.'
          : 'Não foi possível entrar. Tente novamente.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="h-16 w-16" />
        </div>
        <div className="card-glass rounded-2xl p-8">
          <h1 className="text-xl font-extrabold text-zinc-100">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-zinc-500">Entre para acessar seu painel.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-300"
                >
                  <Icon name={show ? 'eyeOff' : 'eye'} className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
            )}

            <button type="submit" disabled={busy} className="btn-neon w-full py-3 text-sm disabled:opacity-60">
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Ainda não tem conta?{' '}
          <Link href="/registro" className="font-semibold text-neon-400 hover:text-neon-300">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GuestOnly>
      <Suspense>
        <LoginForm />
      </Suspense>
    </GuestOnly>
  );
}