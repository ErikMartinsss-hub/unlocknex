'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';
import { Reveal } from '@/components/Reveal';
import { useServices } from '@/lib/hooks';
import { brl } from '@/lib/format';
import { useAuth } from '@/components/AuthProvider';
import { FirestoreBanner } from '@/components/FirestoreBanner';

export default function AtivacaoLicencaPage() {
  const { user } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const todos = useServices(setErro);
  const licencas = useMemo(
    () => todos.filter((s) => s.categoryId === 'cat-licenca' && s.isActive !== false),
    [todos]
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return licencas.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [query, licencas]);

  const orderHref = (id: string) => (user ? `/pedidos/novo?servico=${id}` : '/login');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo />
          <h1 className="hidden text-lg font-extrabold tracking-tight text-zinc-100 sm:block">
            Ativação de <span className="text-fuchsia-500">licença</span>
          </h1>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <div className="mb-6">
          <FirestoreBanner error={erro} />
        </div>
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/5 px-4 py-1.5 text-xs font-semibold text-fuchsia-400">
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              License Activation
            </span>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ativação de <span className="neon-text-glow text-fuchsia-500">licença</span> em minutos
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
              Ativação de licenças de ferramentas e softwares para desbloqueios. Escolha o serviço,
              envie os dados e receba a licença ativada no seu pedido.
            </p>
          </div>
        </Reveal>

        {/* Busca */}
        <Reveal delay={120}>
          <div className="mx-auto mt-8 flex max-w-xl items-center gap-3">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-500"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ativação…"
                className="input-dark pl-11"
              />
            </div>
          </div>
        </Reveal>

        {/* Lista */}
        <div className="mt-10">
          <p className="mb-4 text-sm text-zinc-500">
            {list.length} {list.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s, i) => (
              <Reveal key={s.id} delay={(i % 9) * 50}>
                <div className="card-glass group flex h-full flex-col rounded-2xl p-5 transition hover:-translate-y-1 hover:border-fuchsia-500/40 hover:shadow-[0_0_26px_-8px_rgba(232,121,249,0.45)]">
                  <div className="flex items-start justify-between gap-3">
                    {s.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={s.imageUrl}
                        alt={s.name}
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded-xl border border-zinc-800 object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400 transition-transform duration-300 group-hover:scale-110">
                        <Icon name="sparkles" className="h-5.5 w-5.5" />
                      </span>
                    )}
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-fuchsia-500/25 bg-fuchsia-500/5 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-400">
                      <Icon name="clock" className="h-3 w-3" />
                      {s.deliveryTime}
                    </span>
                  </div>
                  <h3 className="mt-4 line-clamp-3 min-h-14 text-sm font-bold leading-snug text-zinc-100 group-hover:text-fuchsia-300">
                    {s.name}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 min-h-10 text-sm text-zinc-500">{s.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <span className="text-lg font-extrabold text-fuchsia-500">
                      {s.price === 0 ? 'Grátis' : brl(s.price)}
                    </span>
                    <Link href={orderHref(s.id)} className="btn-neon inline-flex items-center gap-1 px-3.5 py-2 text-xs">
                      {user ? 'Solicitar' : 'Entrar p/ solicitar'}
                      <Icon name="arrowRight" className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          {todos.length === 0 ? (
            <div className="card-glass rounded-2xl p-10 text-center text-zinc-500">
              Carregando serviços…
            </div>
          ) : (
            list.length === 0 && (
              <div className="card-glass rounded-2xl p-10 text-center text-zinc-500">
                Nenhuma ativação encontrada com &quot;{query}&quot;.
              </div>
            )
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-zinc-600 sm:flex-row">
          <span>© 2026 UnlockNex. Todos os direitos reservados.</span>
          <span>
            <Icon name="sparkles" className="mr-1 inline h-3.5 w-3.5 text-fuchsia-500" />
            Ativação de licença
          </span>
        </div>
      </footer>
    </div>
  );
}