'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useCategories, useServices } from '@/lib/hooks';
import { Icon } from '@/components/Icon';
import { Reveal } from '@/components/Reveal';
import { FirestoreBanner } from '@/components/FirestoreBanner';
import { brl } from '@/lib/format';

/**
 * Seção "Catálogo" da home com os serviços AO VIVO do Firestore (o que o
 * admin puxa da API aparece aqui na hora). Mostra uma amostra + atalhos por
 * categoria; o catálogo completo fica em /servicos.
 */
export function CatalogHome() {
  const [erro, setErro] = useState<string | null>(null);
  const categories = useCategories(setErro);
  const services = useServices(setErro);

  const ativos = useMemo(() => services.filter((s) => s.isActive !== false), [services]);
  const amostra = ativos.slice(0, 12);

  const contagem = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of ativos) m[s.categoryId] = (m[s.categoryId] ?? 0) + 1;
    return m;
  }, [ativos]);

  return (
    <section id="servicos" className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl">Catálogo</h2>
            <p className="mt-2 text-sm text-zinc-500">
              {ativos.length > 0
                ? `${ativos.length} serviços disponíveis agora na plataforma.`
                : 'Serviços disponíveis agora na plataforma.'}
            </p>
          </div>
          <Link href="/servicos" className="btn-neon inline-flex items-center gap-1.5 px-4 py-2 text-xs">
            Ver catálogo completo
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Reveal>

      <div className="mt-6">
        <FirestoreBanner error={erro} />
      </div>

      {categories.length > 0 && (
        <Reveal delay={60}>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/servicos?cat=${c.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-semibold text-zinc-300 transition hover:border-neon-500/40 hover:text-neon-300"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                {c.name}
                {contagem[c.id] ? <span className="text-zinc-500">({contagem[c.id]})</span> : null}
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {ativos.length === 0 && !erro && (
        <p className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
          O catálogo ainda está vazio — os serviços aparecem aqui assim que forem adicionados no
          painel do administrador.
        </p>
      )}

      {amostra.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {amostra.map((s, i) => {
            const cat = categories.find((c) => c.id === s.categoryId);
            return (
              <Reveal key={s.id} delay={i * 60}>
                <Link
                  href="/servicos"
                  className="card-glass group flex h-full flex-col rounded-2xl p-5 transition hover:-translate-y-1 hover:border-neon-500/40 hover:shadow-[0_0_26px_-8px_rgba(0,255,102,0.45)]"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${cat?.color ?? '#00ff66'}1a`, color: cat?.color ?? '#00ff66' }}
                    >
                      <Icon name={cat?.icon ?? 'grid'} className="h-6 w-6" />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-neon-500/25 bg-neon-500/5 px-2.5 py-1 text-[11px] font-semibold text-neon-400">
                      <Icon name="clock" className="h-3 w-3" />
                      {s.deliveryTime}
                    </span>
                  </div>
                  <h3 className="mt-4 line-clamp-2 min-h-10 font-bold leading-snug text-zinc-100 group-hover:text-neon-300">
                    {s.name}
                  </h3>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <span className="text-xl font-extrabold text-neon-500">{brl(s.price)}</span>
                    <span className="btn-neon inline-flex items-center gap-1 px-3.5 py-2 text-xs">
                      Ver
                      <Icon name="arrowRight" className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}