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
  const [values, setValues] = useState<Record<string, string>>({});
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const svc = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);
  // Campos que a API espera (Email, Username, Serial, Quantity…). Serviços
  // antigos (sem apiFields) usam o apiField único como lista de um item.
  const apiCampos = useMemo(() => {
    if (!svc) return [] as { name: string; type?: string; required?: boolean }[];
    if (Array.isArray(svc.apiFields) && svc.apiFields.length > 0) return svc.apiFields;
    if (svc.apiField) {
      return [{ name: svc.apiField, type: svc.apiField === 'Quantity' ? 'number' : 'text', required: true }];
    }
    return [];
  }, [svc]);
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
    if (svc.isActive === false) {
      setError('Serviço indisponível no momento.');
      return;
    }
    setError(null);
    const isAuto = svc.provider === 'auto';
    const fields: Record<string, string | number> = {};
    if (isAuto) {
      for (const c of apiCampos) {
        const raw = (values[c.name] ?? '').trim();
        const isQty = c.name === 'Quantity' || c.type === 'number';
        if (isQty) {
          const n = Number(raw);
          if (c.required && (!Number.isFinite(n) || n < 1)) {
            setError(`Preencha ${c.name}.`);
            return;
          }
          if (raw) fields[c.name] = Math.floor(n);
        } else if (c.required && !raw) {
          setError(`Preencha ${c.name}.`);
          return;
        } else if (raw) {
          fields[c.name] = raw;
        }
      }
      for (const ex of svc.apiExtra ?? []) {
        const v = (values[ex.key] ?? '').trim();
        if (ex.required && !v) {
          setError(`Preencha ${ex.label}.`);
          return;
        }
        if (v) fields[ex.key] = v;
      }
    }
    const primeiro = apiCampos[0];
    const primeiroVal = primeiro ? (values[primeiro.name] ?? '').trim() : '';
    const primeiroNumero = !!primeiro && (primeiro.name === 'Quantity' || primeiro.type === 'number');
    const deviceLabel =
      apiCampos.length === 0
        ? (values['__identificador'] ?? '').trim() || model.trim() || 'Pedido de serviço'
        : primeiroNumero
          ? `Aluguel de ferramenta (x${Math.floor(Number(primeiroVal) || 0)})`
          : primeiroVal || model.trim() || 'Pedido de serviço';
    setBusy(true);
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
                {services
                  .filter((s) => s.isActive !== false)
                  .map((s) => (
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
              {apiCampos.map((c) => {
                const isQty = c.name === 'Quantity' || c.type === 'number';
                return (
                  <div key={c.name}>
                    <label
                      htmlFor={`campo-${c.name}`}
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
                    >
                      {c.name} {c.required ? '*' : ''}
                    </label>
                    <input
                      id={`campo-${c.name}`}
                      type={isQty ? 'number' : c.type === 'email' ? 'email' : 'text'}
                      min={isQty ? 1 : undefined}
                      step={isQty ? 1 : undefined}
                      required={!!c.required}
                      value={values[c.name] ?? ''}
                      onChange={(e) => setValues((prev) => ({ ...prev, [c.name]: e.target.value }))}
                      placeholder={isQty ? `${c.name} (ex.: 1)` : c.required ? c.name : `${c.name} (opcional)`}
                      className="input-dark font-mono"
                    />
                  </div>
                );
              })}
              {apiCampos.length === 0 && (
                <div>
                  <label htmlFor="identifier" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    IMEI / Identificador
                  </label>
                  <input
                    id="identifier"
                    value={values['__identificador'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, __identificador: e.target.value }))}
                    placeholder="Ex.: 356938035643809"
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
                  placeholder="Ex.: Galaxy A54"
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
                  value={values[extra.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [extra.key]: e.target.value }))}
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