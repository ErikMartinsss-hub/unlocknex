'use client';

import { useMemo, useState } from 'react';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useDownloads } from '@/lib/hooks';
import { Icon } from '@/components/Icon';

function Downloads() {
  const [err, setErr] = useState<string | null>(null);
  const downloads = useDownloads((msg) => setErr(msg));
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<'todas' | 'ferramenta' | 'driver'>('todas');

  const erroPermissao = err && /permission|denied|Missing or insufficient/i.test(err);
  const erroIndice = err && /index/i.test(err);

  const ativos = useMemo(() => downloads.filter((d) => d.isActive !== false), [downloads]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ativos.filter((d) => {
      const matchesCat = cat === 'todas' || d.category === cat;
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.version.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [ativos, query, cat]);

  const ferramentas = filtrados.filter((d) => d.category === 'ferramenta');
  const drivers = filtrados.filter((d) => d.category === 'driver');

  const Section = ({ titulo, icone, items }: { titulo: string; icone: string; items: typeof ferramentas }) => {
    return (
      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon-500/10 text-neon-400">
            <Icon name={icone} className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-100">{titulo}</h2>
          <span className="rounded-full border border-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-500">
            {items.length}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <article
              key={d.id}
              className="card-glass group flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:border-neon-500/40"
            >
              {d.imageUrl ? (
                <div className="relative h-28 shrink-0 overflow-hidden border-b border-zinc-800/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.imageUrl}
                    alt={d.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {d.version && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-200 backdrop-blur">
                      v{d.version}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between px-5 pt-5">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                      d.category === 'driver' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-neon-500/10 text-neon-400'
                    }`}
                  >
                    <Icon name={d.category === 'driver' ? 'chip' : 'wrench'} className="h-5.5 w-5.5" />
                  </span>
                  {d.version && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
                      <Icon name="clock" className="h-3.5 w-3.5" />
                      {d.version}
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-bold leading-snug text-zinc-100 group-hover:text-neon-300">{d.name}</h3>
                <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-zinc-500">{d.description}</p>
                <div className="mt-4 flex-1 border-t border-zinc-800/70 pt-4">
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-neon-500 px-3.5 py-2 text-xs font-bold text-zinc-950 transition hover:bg-neon-400"
                  >
                    Baixar agora
                    <Icon name="download" className="h-4 w-4" />
                  </a>
                ) : (
                  <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-500">
                    Link em breve
                  </div>
                )}
              </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  return (
    <AppShell header="Central de Downloads">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100">
              Central de <span className="text-neon-400">Downloads</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Programas essenciais, drivers e utilitários para o dia a dia da sua assistência.
            </p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Icon name="search" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar programa…"
              className="input-dark pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['todas', 'Todas'],
              ['ferramenta', 'Ferramentas'],
              ['driver', 'Drivers'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setCat(id)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                cat === id
                  ? 'border-neon-500/50 bg-neon-500/10 text-neon-400'
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {(erroPermissao || erroIndice) && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            <p className="font-bold">Não deu pra carregar os downloads.</p>
            <p className="mt-1">
              {erroPermissao
                ? 'Isso é falta de permissão de leitura: o administrador precisa clicar em "Publicar regras do banco" no painel /admin (ou colar as regras no console do Firestore).'
                : 'Falta um índice no Firestore: ' + err}
            </p>
            <p className="mt-1 opacity-70">{err}</p>
          </div>
        )}
        {filtrados.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 p-10 text-center text-sm text-zinc-500">
            {downloads.length === 0
              ? 'Nenhum download cadastrado ainda. O administrador precisa sincronizar a central de downloads.'
              : `Nenhum programa encontrado para "${query}".`}
          </div>
        ) : (
          <>
            {cat !== 'driver' && <Section titulo="Ferramentas" icone="wrench" items={ferramentas} />}
            {cat !== 'ferramenta' && <Section titulo="Drivers" icone="chip" items={drivers} />}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function DownloadsPage() {
  return (
    <RequireAuth>
      <Downloads />
    </RequireAuth>
  );
}