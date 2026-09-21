'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GuestOnly } from '@/components/Guard';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';

function RegisterForm() {
  const { register } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
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
      await register(name, email, password);
      push('Conta criada! Bem-vindo à UnlockNex.', 'ok');
      router.replace('/dashboard');
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(
        code === 'auth/email-already-in-use'
          ? 'Este e-mail já está cadastrado. Faça login.'
          : code === 'auth/weak-password'
            ? 'A senha precisa ter pelo menos 6 caracteres.'
            : 'Não foi possível criar a conta. Tente novamente.'
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
          <h1 className="text-xl font-extrabold text-zinc-100">Criar conta</h1>
          <p className="mt-1 text-sm text-zinc-500">Comece a usar a plataforma em instantes.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Nome
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-dark"
              />
            </div>
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
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
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
              {busy ? 'Criando…' : 'Criar conta'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold text-neon-400 hover:text-neon-300">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <GuestOnly>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </GuestOnly>
  );
}