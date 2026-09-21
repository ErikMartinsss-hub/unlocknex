import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';
import { Reveal } from '@/components/Reveal';
import { categoriesSeed, servicesSeed, marcas, pagamentos } from '@/lib/seed-data';
import { brl } from '@/lib/format';

export default function Page() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
            <a href="#servicos" className="transition hover:text-neon-400">Serviços</a>
            <a href="#como-funciona" className="transition hover:text-neon-400">Como funciona</a>
            <a href="#pagamentos" className="transition hover:text-neon-400">Pagamentos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              Entrar
            </Link>
            <Link href="/register" className="btn-neon px-4 py-2 text-sm">
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] animate-glow-pulse rounded-full bg-neon-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 animate-float rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 animate-float rounded-full bg-fuchsia-500/10 blur-3xl" style={{ animationDelay: '-3s' }} />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-neon-500/30 bg-neon-500/5 px-4 py-1.5 text-xs font-semibold text-neon-400">
              <Icon name="bolt" className="h-3.5 w-3.5" />
              Para técnicos de celular
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Desbloqueios em{' '}
              <span className="text-gradient-animate neon-text-glow">minutos</span>, sem equipamentos caros
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-400 sm:text-lg">
              FRP, IMEI, MDM, desbloqueio de operadora e ativação iOS. Automatizado, com painel próprio, saldo e suporte.
              A plataforma pensada para o técnico brasileiro.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn-neon px-6 py-3 text-sm">
                Começar agora
                <Icon name="arrowRight" className="ml-2 inline h-4 w-4" />
              </Link>
              <a href="#servicos" className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white">
                Ver serviços
              </a>
            </div>
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: 'bolt', title: 'Entregas', text: 'Instantâneo na maioria' },
              { icon: 'coin', title: 'Preços justos', text: 'A partir de R$ 8,90' },
              { icon: 'shield', title: 'Seguro', text: 'Dados cuidados com zelo' },
              { icon: 'chat', title: 'Suporte', text: 'Tickets diretos' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <div className="card-glass rounded-2xl p-5 text-left transition hover:-translate-y-1 hover:border-neon-500/40">
                  <Icon name={f.icon} className="h-6 w-6 text-neon-400" />
                  <p className="mt-3 font-bold text-zinc-100">{f.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y border-zinc-800 bg-zinc-900/40 py-4 overflow-hidden">
        <div className="animate-marquee flex w-max gap-12">
          {[...marcas, ...marcas, ...marcas, ...marcas].map((m, i) => (
            <span key={i} className="text-sm font-bold uppercase tracking-widest text-zinc-600">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Serviços */}
      <section id="servicos" className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Serviços disponíveis</h2>
            <p className="mt-2 text-zinc-400">Escolha o serviço, envie os dados do aparelho e receba a liberação.</p>
          </div>
          <Link href="/register" className="hidden items-center gap-1.5 text-sm font-semibold text-neon-400 transition hover:text-neon-300 sm:inline-flex">
            Criar conta e começar
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicesSeed.slice(0, 6).map((s, i) => {
            const cat = categoriesSeed.find((c) => c.id === s.categoryId);
            return (
              <Reveal key={s.id} delay={i * 70}>
                <div className="card-glass group rounded-2xl p-5 transition hover:-translate-y-1 hover:border-neon-500/40 hover:shadow-[0_0_26px_-8px_rgba(0,255,102,0.45)]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: `${cat?.color}1a`, color: cat?.color }}>
                      <Icon name={cat?.icon ?? 'grid'} className="h-5 w-5" />
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
                      <Icon name="clock" className="h-3.5 w-3.5" />
                      {s.deliveryTime}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-zinc-100 group-hover:text-neon-300">{s.name}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500">{s.description}</p>
                  <p className="mt-4 text-xl font-extrabold text-neon-500">{brl(s.price)}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="border-y border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-tight">Como funciona</h2>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { n: '1', t: 'Adicione saldo', d: 'Pague com PIX, cartão, cripto ou boleto e tenha saldo no painel.' },
              { n: '2', t: 'Faça o pedido', d: 'Escolha o serviço, informe IMEI/modelo e confirme a compra.' },
              { n: '3', t: 'Receba a liberação', d: 'Acompanhe o status em tempo real e resolva o aparelho do seu cliente.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 110}>
                <div className="card-glass group rounded-2xl p-6 transition hover:-translate-y-1 hover:border-neon-500/40">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neon-500 text-lg font-extrabold text-zinc-950 neon-glow-sm transition-transform duration-300 group-hover:scale-110">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-zinc-100">{s.t}</h3>
                  <p className="mt-2 text-sm text-zinc-500">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pagamentos */}
      <section id="pagamentos" className="mx-auto max-w-6xl px-4 py-20 text-center">
        <Reveal>
          <h2 className="text-3xl font-extrabold tracking-tight">Pagamentos</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-2 text-zinc-400">Métodos simples para você carregar seu saldo.</p>
        </Reveal>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {pagamentos.map((p, i) => (
            <Reveal key={p} delay={i * 60}>
              <span className="card-glass inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:-translate-y-0.5 hover:border-neon-500/40 hover:text-neon-300">
                {p}
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <Logo size="h-7 w-7" />
            <span>© 2026 UnlockNex</span>
          </div>
          <div className="flex gap-6">
            <a href="#servicos" className="transition hover:text-zinc-300">Serviços</a>
            <a href="#como-funciona" className="transition hover:text-zinc-300">Como funciona</a>
            <a href="/login" className="transition hover:text-zinc-300">Entrar</a>
          </div>
        </div>
      </footer>
    </div>
  );
}