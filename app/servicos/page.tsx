'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useCategories, useServices } from '@/lib/hooks';
import { Icon } from '@/components/Icon';
import { brl } from '@/lib/format';

function Servicos() {
  const categories = useCategories();
  const services = useServices();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('todas');

  const filtered = services.filter((s) => {
    const matchesCat = cat === 'todas' || s.categoryId === cat;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? 'Serviço';

  return (
    <AppShell header="Serviços disponíveis">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Icon name="search" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar serviço…"
              className="input-dark pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat('todas')}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              cat === 'todas'
                ? 'border-neon-500/50 bg-neon-500/10 text-neon-400'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                cat === c.id
                  ? 'border-neon-500/50 bg-neon-500/10 text-neon-400'
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-zinc-800 p-10 text-center text-sm text-zinc-500">
              Nenhum serviço encontrado para &quot;{query}&quot;.
            </div>
          )}
          {filtered.map((s) => {
            const color = categories.find((c) => c.id === s.categoryId)?.color ?? '#00ff66';
            const icon = categories.find((c) => c.id === s.categoryId)?.icon ?? 'grid';
            return (
              <div key={s.id} className="card-glass group flex flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-neon-500/40">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}1a`, color }}>
                    <Icon name={icon} className="h-5 w-5" />
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
                    <Icon name="clock" className="h-3.5 w-3.5" />
                    {s.deliveryTime}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">{catName(s.categoryId)}</p>
                <h3 className="mt-1 font-bold leading-snug text-zinc-100 group-hover:text-neon-300">{s.name}</h3>
                <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-zinc-500">{s.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800/70 pt-4">
                  <span className="text-xl font-extrabold text-neon-500">{brl(s.price)}</span>
                  <Link
                    href={`/pedidos/novo?servico=${s.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-neon-500 px-3.5 py-2 text-xs font-bold text-zinc-950 transition hover:bg-neon-400"
                  >
                    Solicitar
                    <Icon name="arrowRight" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

export default function ServicosPage() {
  return (
    <RequireAuth>
      <Servicos />
    </RequireAuth>
  );
}