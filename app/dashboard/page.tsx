'use client';

import Link from 'next/link';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';
import { useServices, useOrders } from '@/lib/hooks';
import { Icon } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';
import { brl, dateTimeBR, orderStatus, apiStatusLabel } from '@/lib/format';

function Dashboard() {
  const { profile } = useAuth();
  const { push } = useToast();
  const services = useServices();
  const orders = useOrders(profile?.uid, 8);
  const quick = services.slice(0, 4);
  const concluded = orders.filter((o) => o.status === 'concluido').length;
  const inProgress = orders.filter((o) => o.status === 'processando' || o.status === 'pendente').length;

  return (
    <AppShell header="Bem-vindo de volta, Técnico!">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-100">Olá, {profile?.name?.split(' ')[0] ?? 'Técnico'}!</h1>
          <p className="mt-1 text-sm text-zinc-500">Que tal resolver um aparelho hoje?</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Saldo Atual</p>
              <Icon name="coin" className="h-5 w-5 text-neon-400" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-neon-500">{brl(profile?.balance ?? 0)}</p>
            <button
              onClick={() => push('Recarga em breve. Estamos integrando o PIX.', 'info')}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-neon-400 hover:text-neon-300"
            >
              <Icon name="plus" className="h-3.5 w-3.5" />
              Adicionar créditos
            </button>
          </div>
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total de Pedidos</p>
              <Icon name="file" className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-zinc-100">{orders.length}</p>
            <p className="mt-3 text-xs text-zinc-500">{concluded} concluído{concluded === 1 ? '' : 's'} neste período</p>
          </div>
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Em Andamento</p>
              <Icon name="clock" className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-zinc-100">{inProgress}</p>
            <p className="mt-3 text-xs text-zinc-500">Processamento automático ativo</p>
          </div>
        </div>

        {/* Atalhos */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100">Serviços em destaque</h2>
            <Link href="/servicos" className="text-sm font-semibold text-neon-400 hover:text-neon-300">
              Ver todos
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quick.map((s) => (
              <Link
                key={s.id}
                href={`/pedidos/novo?servico=${s.id}`}
                className="card-glass rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-neon-500/40"
              >
                <p className="text-sm font-semibold leading-snug text-zinc-100">{s.name}</p>
                <p className="mt-2 text-xs text-zinc-500">{s.deliveryTime}</p>
                <p className="mt-2 text-lg font-extrabold text-neon-500">{brl(s.price)}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Últimos pedidos */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100">Últimos Pedidos</h2>
            <Link href="/pedidos" className="text-sm font-semibold text-neon-400 hover:text-neon-300">
              Ver todos
            </Link>
          </div>
          <div className="card-glass overflow-x-auto rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Serviço</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Preço</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-zinc-500">
                      Nenhum pedido ainda. <Link href="/servicos" className="text-neon-400">Comece agora</Link>.
                    </td>
                  </tr>
                )}
                {orders.map((o) => {
                  const svc = services.find((s) => s.id === o.serviceId);
                  return (
                    <tr key={o.id} className="border-b border-zinc-800/60 last:border-0">
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">#{o.id.slice(0, 6)}</td>
                      <td className="max-w-[220px] truncate px-5 py-3.5 text-zinc-200">
                        {svc?.name ?? 'Serviço removido'}
                        {o.deviceModel && <span className="block text-xs text-zinc-500">{o.deviceModel}</span>}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500">{dateTimeBR(o.createdAt)}</td>
                      <td className="px-5 py-3.5 font-semibold text-zinc-200">{brl(o.cost)}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge info={orderStatus(o.status)} />
                        {o.apiStatus && (
                          <p className="mt-1 text-[11px] leading-tight text-zinc-500">{apiStatusLabel(o.apiStatus)}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}