'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Icon } from '@/components/Icon';

export function FirebaseNotConfigured({ title = 'Aguardando configuração' }: { title?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neon-500/30 bg-zinc-900 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neon-500/10 text-neon-400 neon-glow-sm">
          <Icon name="alert" className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-bold text-zinc-100">{title}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          O app precisa das variáveis do Firebase no arquivo <code className="text-neon-400">.env.local</code>. Veja o{' '}
          <code className="text-neon-400">.env.local.example</code> e o README para configurar.
        </p>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, user, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && configured && !user) router.replace('/login');
  }, [ready, configured, user, router]);

  if (!configured) return <FirebaseNotConfigured />;

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-500/30 border-t-neon-500" />
      </div>
    );
  }

  return <>{children}</>;
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { ready, user, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && configured && user) router.replace('/dashboard');
  }, [ready, configured, user, router]);

  if (!configured) return <FirebaseNotConfigured title="Aguardando configuração" />;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-500/30 border-t-neon-500" />
      </div>
    );
  }

  return <>{children}</>;
}