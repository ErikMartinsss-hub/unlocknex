import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';
import { Reveal } from '@/components/Reveal';
import { categoriesSeed, servicesSeed, marcas, pagamentos } from '@/lib/seed-data';
import { brl } from '@/lib/format';

function ServiceCard({ s, i }: { s: (typeof servicesSeed)[number]; i: number }) {
  const cat = categoriesSeed.find((c) => c.id === s.categoryId);
  return (
    <Reveal delay={i * 60}>
      <Link
        href={`/servicos#${s.id}`}
        className="card-glass group flex h-full flex-col rounded-2xl p-5 transition hover:-translate-y-1 hover:border-neon-500/40 hover:shadow-[0_0_26px_-8px_rgba(0,255,102,0.45)]"
      >
        <div className="flex items-center justify-between">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${cat?.color}1a`, color: cat?.color }}
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
            Comprar
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

function SectionHead({ title, sub, id }: { title: string; sub?: string; id?: string }) {
  return (
    <Reveal>
      <div id={id} className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl">{title}</h2>
          {sub && <p className="mt-2 text-sm text-zinc-500">{sub}</p>}
        </div>
      </div>
    </Reveal>
  );
}

export default function Page() {
  const bestSelling = servicesSeed.slice(0, 8);
  const recentes = servicesSeed.slice(8, 16);

  const features = [
    { icon: 'bolt', title: 'Entrega rápida', text: 'Resultado em minutos na maioria dos serviços' },
    { icon: 'shield', title: '100% seguro', text: 'Plataforma criptografada e dados protegidos' },
    { icon: 'chat', title: 'Suporte 24/7', text: 'Acompanhamento por tickets diretos' },
    { icon: 'credit', title: 'Recarga fácil', text: 'PIX, cartão, cripto e boleto' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-zinc-400 lg:flex">
            <a href="#servicos" className="transition hover:text-neon-400">Serviços</a>
            <a href="#recentes" className="transition hover:text-neon-400">Recentes</a>
            <a href="#como-funciona" className="transition hover:text-neon-400">Como funciona</a>
            <a href="#pagamentos" className="transition hover:text-neon-400">Pagamentos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
            >
              Entrar
            </Link>
            <Link href="/register" className="btn-neon px-4 py-2 text-sm">
              Criar conta
            </Link>
          </div>
        </div>
        <div className="border-t border-zinc-800/50">
          <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2.5 text-xs">
            <span className="shrink-0 text-zinc-500">Acesso rápido:</span>
            {categoriesSeed.map((c) => (
              <a
                key={c.id}
                href="#servicos"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 font-semibold text-zinc-300 transition hover:border-neon-500/40 hover:text-neon-300"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                {c.name}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Banner / Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] animate-glow-pulse rounded-full bg-neon-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 animate-float rounded-full bg-cyan-500/10 blur-3xl" />
        <div
          className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 animate-float rounded-full bg-fuchsia-500/10 blur-3xl"
          style={{ animationDelay: '-3s' }}
        />
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-12">
          <Reveal>
            <div className="card-glass relative overflow-hidden rounded-3xl p-8 text-center sm:p-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-neon-500/30 bg-neon-500/5 px-4 py-1.5 text-xs font-semibold text-neon-400">
                <Icon name="bolt" className="h-3.5 w-3.5" />
                Para técnicos de celular
              </span>
              <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Desbloqueios em{' '}
                <span className="text-gradient-animate neon-text-glow">minutos</span>, sem equipamentos caros
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-400">
                FRP, IMEI, MDM, desbloqueio de operadora e ativação iOS. Automatizado, com painel próprio, saldo e
                suporte. A plataforma pensada para o técnico brasileiro.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/register" className="btn-neon px-6 py-3 text-sm">
                  Começar agora
                  <Icon name="arrowRight" className="ml-2 inline h-4 w-4" />
                </Link>
                <a
                  href="#servicos"
                  className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                >
                  Ver serviços
                </a>
              </div>
            </div>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {features.map((f, i) => (
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
      <div className="overflow-hidden border-y border-zinc-800 bg-zinc-900/40 py-4">
        <div className="animate-marquee flex w-max gap-12">
          {[...marcas, ...marcas, ...marcas, ...marcas].map((m, i) => (
            <span key={i} className="text-sm font-bold uppercase tracking-widest text-zinc-600">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Best Selling */}
      <section id="servicos" className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead
          title="Mais vendidos"
          sub="Os serviços mais escolhidos pelos técnicos hoje."
          id="best-selling"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bestSelling.map((s, i) => (
            <ServiceCard key={s.id} s={s} i={i} />
          ))}
        </div>
      </section>

      {/* Recent Added */}
      <section id="recentes" className="border-y border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHead
            title="Adicionados recentemente"
            sub="Novos serviços entrando na plataforma."
            id="recentes-head"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentes.map((s, i) => (
              <ServiceCard key={s.id} s={s} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead title="Como funciona" sub="Em três passos simples." />
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
      </section>

      {/* Pagamentos */}
      <section id="pagamentos" className="border-y border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <Reveal>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl">Pagamentos</h2>
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
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 text-sm text-zinc-400 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <Logo size="h-9 w-9" />
            </div>
            <p className="mt-4 text-zinc-500">A plataforma de desbloqueios pensada para o técnico brasileiro.</p>
            <p className="mt-4 flex items-center gap-2 text-zinc-500">
              <Icon name="mail" className="h-4 w-4" />
              suporte@unlocknex.com.br
            </p>
          </div>
          <div>
            <h4 className="font-bold text-zinc-100">Empresa</h4>
            <ul className="mt-4 space-y-2.5">
              <li><a href="/" className="transition hover:text-neon-300">Home</a></li>
              <li><a href="#servicos" className="transition hover:text-neon-300">Serviços</a></li>
              <li><a href="#como-funciona" className="transition hover:text-neon-300">Como funciona</a></li>
              <li><a href="/tickets" className="transition hover:text-neon-300">Suporte</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-zinc-100">Acesso rápido</h4>
            <ul className="mt-4 space-y-2.5">
              <li><a href="/login" className="transition hover:text-neon-300">Entrar</a></li>
              <li><a href="/register" className="transition hover:text-neon-300">Criar conta</a></li>
              <li><a href="#pagamentos" className="transition hover:text-neon-300">Pagamentos</a></li>
              <li><a href="#recentes" className="transition hover:text-neon-300">Novos serviços</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-zinc-100">Métodos de pagamento</h4>
            <div className="mt-4 flex flex-wrap gap-2">
              {pagamentos.map((p) => (
                <span key={p} className="card-glass rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-300">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-zinc-600 sm:flex-row">
            <span>© 2026 UnlockNex. Todos os direitos reservados.</span>
            <span>
              <Icon name="bolt" className="mr-1 inline h-3.5 w-3.5 text-neon-500" />
              Feito para técnicos
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}