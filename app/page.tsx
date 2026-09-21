import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';
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
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-neon-500/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-neon-500/30 bg-neon-500/5 px-4 py-1.5 text-xs font-semibold text-neon-400">
            <Icon name="bolt" className="h-3.5 w-3.5" />
            Para técnicos de celular
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Desbloqueios em <span className="text-neon-500 neon-glow-sm">minutos</span>, sem equipamentos caros
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-400 sm:text-lg">
            FRP, IMEI, MDM, desbloqueio de operadora e ativação iOS. Automatizado, com painel próprio, saldo e suporte.
            A plataforma pensada para o técnico brasileiro.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-neon px-6 py-3 text-sm">
              Começar agora
              <Icon name="arrowRight" className="ml-2 inline h-4 w-4" />
            </Link>
            <a href="#servicos" className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white">
              Ver serviços
            </a>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: 'bolt', title: 'Entregas', text: 'Instantâneo na maioria' },
              { icon: 'coin', title: 'Preços justos', text: 'A partir de R$ 8,90' },
              { icon: 'shield', title: 'Seguro', text: 'Dados cuidados com zelo' },
              { icon: 'chat', title: 'Suporte', text: 'Tickets diretos' },
            ].map((f) => (
              <div key={f.title} className="card-glass rounded-2xl p-5 text-left">
                <Icon name={f.icon} className="h-6 w-6 text-neon-400" />
                <p className="mt-3 font-bold text-zinc-100">{f.title}</p>
                <p className="mt-1 text-sm text-zinc-500">{f.text}</p>
              </div>
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
          {servicesSeed.slice(0, 6).map((s) => {
            const cat = categoriesSeed.find((c) => c.id === s.categoryId);
            return (
              <div key={s.id} className="card-glass group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-neon-500/40">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${cat?.color}1a`, color: cat?.color }}>
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
            );
          })}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="border-y border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-extrabold tracking-tight">Como funciona</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { n: '1', t: 'Adicione saldo', d: 'Pague com PIX, cartão, cripto ou boleto e tenha saldo no painel.' },
              { n: '2', t: 'Faça o pedido', d: 'Escolha o serviço, informe IMEI/modelo e confirme a compra.' },
              { n: '3', t: 'Receba a liberação', d: 'Acompanhe o status em tempo real e resolva o aparelho do seu cliente.' },
            ].map((s) => (
              <div key={s.n} className="card-glass rounded-2xl p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neon-500 text-lg font-extrabold text-zinc-950 neon-glow-sm">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-bold text-zinc-100">{s.t}</h3>
                <p className="mt-2 text-sm text-zinc-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pagamentos */}
      <section id="pagamentos" className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">Pagamentos</h2>
        <p className="mt-2 text-zinc-400">Métodos simples para você carregar seu saldo.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {pagamentos.map((p) => (
            <span key={p} className="card-glass rounded-xl px-6 py-3 text-sm font-semibold text-zinc-300">
              {p}
            </span>
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