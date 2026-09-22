'use client';

import Link from 'next/link';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { useServices, useOrders } from '@/lib/hooks';
import { Icon } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';
import { brl, dateTimeBR, orderStatus, apiStatusLabel } from '@/lib/format';

type OrderRow = { delivery?: Record<string, string> | string | null; replayRaw?: string };

function DeliveryBox({ o }: { o: OrderRow }) {
  if (!o.delivery) return null;
  const obj = typeof o.delivery === 'object' ? o.delivery : null;
  const text = obj ? null : o.delivery;
  return (
    <details className="mt-1.5">
      <summary className="cursor-pointer text-[11px] font-semibold text-neon-400 hover:underline">Ver credenciais</summary>
      <div className="mt-1.5 w-64 rounded-lg border border-neon-500/20 bg-zinc-900/80 p-2.5 font-mono text-[11px] leading-relaxed">
        {obj ? (
          <dl className="space-y-1">
            {Object.entries(obj).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="shrink-0 text-zinc-500">{k}:</dt>
                <dd className="break-all text-zinc-200">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <pre className="whitespace-pre-wrap break-words text-zinc-200">{String(text)}</pre>
        )}
      </div>
    </details>
  );
}

function Pedidos() {
  const { profile } = useAuth();
  const services = useServices();
  const orders = useOrders(profile?.uid, 100);

  return (
    <AppShell header="Meus pedidos">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">{orders.length} pedido{orders.length === 1 ? '' : 's'} no total</p>
          <Link href="/pedidos/novo" className="btn-neon inline-flex items-center gap-1.5 px-4 py-2.5 text-sm">
            <Icon name="plus" className="h-4 w-4" />
            Novo pedido
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="card-glass rounded-2xl p-12 text-center">
            <Icon name="file" className="mx-auto h-10 w-10 text-zinc-600" />
            <h2 className="mt-4 text-lg font-bold text-zinc-100">Nenhum pedido ainda</h2>
            <p className="mt-1 text-sm text-zinc-500">Escolha um serviço e faça sua primeira liberação.</p>
            <Link href="/servicos" className="btn-neon mt-6 inline-flex px-5 py-2.5 text-sm">
              Ver serviços
            </Link>
          </div>
        ) : (
          <div className="card-glass overflow-x-auto rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Serviço</th>
                  <th className="px-5 py-3">Identificador</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Preço</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const svc = services.find((s) => s.id === o.serviceId);
                  return (
                    <tr key={o.id} className="border-b border-zinc-800/60 last:border-0">
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">#{o.id.slice(0, 6)}</td>
                      <td className="max-w-[240px] px-5 py-3.5">
                        <p className="truncate font-medium text-zinc-200">{svc?.name ?? 'Serviço removido'}</p>
                        {o.deviceModel && <p className="text-xs text-zinc-500">{o.deviceModel}</p>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">{o.deviceIdentifier}</td>
                      <td className="px-5 py-3.5 text-zinc-500">{dateTimeBR(o.createdAt)}</td>
                      <td className="px-5 py-3.5 font-semibold text-zinc-200">{brl(o.cost)}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge info={orderStatus(o.status)} />
                        {o.apiStatus && (
                          <p className="mt-1 text-[11px] leading-tight text-zinc-500">{apiStatusLabel(o.apiStatus)}</p>
                        )}
                        <DeliveryBox o={o} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function PedidosPage() {
  return (
    <RequireAuth>
      <Pedidos />
    </RequireAuth>
  );
}