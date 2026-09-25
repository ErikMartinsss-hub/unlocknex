'use client';

import { useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';
import { useServices } from '@/lib/hooks';
import { getDbFirebase } from '@/lib/firebase';
import { brl } from '@/lib/format';

function NovoPedido() {
  const { user, profile, refreshProfile } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const services = useServices();
  const selectedId = searchParams.get('servico');

  const [serviceId, setServiceId] = useState(selectedId ?? '');
  const [identifier, setIdentifier] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const svc = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);
  const balance = profile?.balance ?? 0;
  const insufficient = svc ? balance < svc.price : false;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svc) {
      setError('Selecione um serviço.');
      return;
    }
    if (insufficient) {
      setError(`Saldo insuficiente. Você precisa de ${brl(svc.price)} e tem ${brl(balance)}.`);
      return;
    }
    setBusy(true);
    setError(null);
    const isAuto = svc.provider === 'auto';
    const fieldKey = svc.apiField ?? '';
    const fields: Record<string, string | number> = {};
    let deviceLabel = identifier.trim();
    if (isAuto) {
      if (fieldKey === 'Quantity') {
        fields.Quantity = quantity;
        deviceLabel = `Aluguel de ferramenta (x${quantity})`;
      } else {
        fields[fieldKey] = identifier.trim();
      }
      for (const ex of svc.apiExtra ?? []) {
        const v = extras[ex.key]?.trim();
        if (v) fields[ex.key] = v;
      }
    }
    try {
      const db = getDbFirebase();
      const idToken = await user!.getIdToken();
      const resCreate = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ serviceId: svc.id, deviceIdentifier: deviceLabel, deviceModel: model.trim() || null }),
      });
      const created = (await resCreate.json().catch(() => ({ ok: false }))) as {
        ok?: boolean;
        orderId?: string;
        message?: string;
      };
      if (!resCreate.ok || !created.ok || !created.orderId) {
        setError(created.message ?? 'Não foi possível criar o pedido. Tente novamente.');
        return;
      }
      const orderId = created.orderId;
      await refreshProfile();

      if (svc.provider === 'auto' && svc.productUuid) {
        try {
          const res = await fetch('/api/heartunlocks/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ orderId, fields }),
          });
          const data = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean; orderUuid?: string; message?: string };
          if (res.ok && data.ok) {
            await updateDoc(doc(db, 'orders', orderId), { apiStatus: 'submetido', apiOrderId: data.orderUuid });
            push('Pedido enviado! Processamento automático iniciado.', 'ok');
          } else {
            await updateDoc(doc(db, 'orders', orderId), { status: 'pendente', providerError: data.message ?? 'Falha no provedor externo.' });
            push(`Pedido criado, mas o provedor recusou (${data.message ?? 'erro'}). Vamos verificar.`, 'err');
          }
        } catch {
          await updateDoc(doc(db, 'orders', orderId), { status: 'pendente', providerError: 'Falha de comunicação com o provedor.' });
          push('Pedido criado com pendência. O suporte vai verificar.', 'info');
        }
      } else {
        push('Pedido criado! Acompanhe o status.', 'ok');
      }
      router.replace('/pedidos');
    } catch {
      setError('Não foi possível criar o pedido. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell header="Novo pedido">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-zinc-100">Dados do serviço</h2>
          <p className="mt-1 text-sm text-zinc-500">Selecione o serviço e informe os dados do aparelho.</p>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Serviço</label>
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="input-dark" required>
                <option value="">— Escolha um serviço —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {brl(s.price)}
                  </option>
                ))}
              </select>
            </div>

            {svc && (
              <div className="flex items-center justify-between rounded-xl border border-neon-500/25 bg-neon-500/5 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{svc.name}</p>
                  <p className="text-xs text-zinc-500">{svc.deliveryTime}</p>
                </div>
                <p className="text-xl font-extrabold text-neon-500">{brl(svc.price)}</p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {svc?.apiField === 'Quantity' ? (
                <div>
                  <label htmlFor="quantity" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Quantidade *
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="input-dark font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="identifier" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {svc?.apiField ? `${svc.apiField} *` : 'IMEI / Identificador *'}
                  </label>
                  <input
                    id="identifier"
                    required={svc?.provider === 'auto'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={svc?.apiField ? `${svc.apiField} do aparelho` : 'Ex.: 356938035643809'}
                    className="input-dark font-mono"
                  />
                </div>
              )}
              <div>
                <label htmlFor="model" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Modelo / Observação
                </label>
                <input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={svc?.apiField === 'Quantity' ? 'Opcional' : 'Ex.: Galaxy A54'}
                  className="input-dark"
                />
              </div>
            </div>

            {svc?.apiExtra?.map((extra) => (
              <div key={extra.key}>
                <label htmlFor={`extra-${extra.key}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {extra.label} {extra.required ? '*' : ''}
                </label>
                <input
                  id={`extra-${extra.key}`}
                  required={!!extra.required}
                  value={extras[extra.key] ?? ''}
                  onChange={(e) => setExtras((prev) => ({ ...prev, [extra.key]: e.target.value }))}
                  placeholder={extra.label}
                  className="input-dark"
                />
              </div>
            ))}

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">{error}</p>
            )}

            <div className="flex items-center justify-between border-t border-zinc-800 pt-5">
              <div>
                <p className="text-xs text-zinc-500">Saldo disponível</p>
                <p className={`text-sm font-bold ${insufficient ? 'text-red-400' : 'text-zinc-100'}`}>{brl(balance)}</p>
              </div>
              <button
                type="submit"
                disabled={busy || !svc || insufficient}
                className="btn-neon px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Criando…' : `Confirmar ${svc ? `— ${brl(svc.price)}` : ''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

export default function NovoPedidoPage() {
  return (
    <RequireAuth>
      <Suspense>
        <NovoPedido />
      </Suspense>
    </RequireAuth>
  );
}