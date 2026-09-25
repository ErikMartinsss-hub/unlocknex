'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';
import { useTransactions } from '@/lib/hooks';
import { getDbFirebase } from '@/lib/firebase';
import { Icon } from '@/components/Icon';
import { brl, dateTimeBR, transactionType, paymentMethodLabel } from '@/lib/format';

function Perfil() {
  const { user, profile, refreshProfile } = useAuth();
  const { push } = useToast();
  const transactions = useTransactions(profile?.uid);
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [charging, setCharging] = useState(false);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiaECola, setCopiaECola] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const didSweep = useRef(false);

  // Reconciliação automática: se algum PIX foi pago mas o webhook não creditou
  // (webhook perdido/rejeitado), credita na hora que o Perfil abrir.
  useEffect(() => {
    if (!user || didSweep.current) return;
    didSweep.current = true;
    syncPayments({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const syncPayments = async (opts: { silent?: boolean } = {}) => {
    if (checking) return;
    setChecking(true);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/pix/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: '{}',
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        credited?: string[];
        alreadyConfirmed?: string[];
        stillPending?: string[];
        error?: string | null;
        message?: string;
      } | null;
      const creditedCount = (data?.credited?.length ?? 0) + (data?.alreadyConfirmed?.length ?? 0);
      if (res.ok && data?.ok && creditedCount > 0) {
        refreshProfile();
        push(`Pagamento confirmado! Créditos adicionados ao saldo.`, 'ok');
      } else if (res.ok && data?.ok && (data.stillPending?.length ?? 0) > 0) {
        push('Pagamento localizado, mas ainda não aprovado no Mercado Pago.', 'err');
      } else if (res.ok && data?.ok && data.error) {
        push(`Erro ao sincronizar: ${data.error}`, 'err');
      } else if (res.ok && data?.ok && !opts.silent) {
        push('Nenhuma cobrança pendente encontrada nesta conta.', 'err');
      } else if (!res.ok && !opts.silent) {
        push(data?.message ?? 'Não foi possível verificar o pagamento.', 'err');
      }
    } catch {
      if (!opts.silent) push('Falha na comunicação. Tente novamente.', 'err');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!paymentId) return;
    const unsub = onSnapshot(
      doc(getDbFirebase(), 'payments', paymentId),
      (snap) => {
        const d = snap.data();
        if (d?.status === 'confirmed') {
          setPaymentId(null);
          setQrCode(null);
          setCopiaECola(null);
          setShowAdd(false);
          setAmount('');
          refreshProfile();
          push('PIX confirmado! Créditos adicionados ao saldo.', 'ok');
        }
      },
      () => {}
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const save = async () => {
    if (!name.trim()) return;
    try {
      await updateDoc(doc(getDbFirebase(), 'users', user!.uid), { name: name.trim(), phone: phone.trim() || null });
      await refreshProfile();
      push('Perfil atualizado.', 'ok');
    } catch {
      push('Não foi possível salvar.', 'err');
    }
  };

  const chargePix = async (value: number) => {
    setCharging(true);
    setChargeError(null);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/pix/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ amount: value }),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as {
        ok?: boolean;
        paymentId?: string;
        qrCode?: string;
        copiaECola?: string;
        message?: string;
      };
      if (res.ok && data.ok && data.paymentId) {
        setPaymentId(data.paymentId);
        setQrCode(data.qrCode ?? null);
        setCopiaECola(data.copiaECola ?? null);
        push('Cobrança PIX criada. Escaneie o QR ou copie o código.', 'ok');
      } else {
        setChargeError(data.message ?? 'Não foi possível gerar a cobrança.');
      }
    } catch {
      setChargeError('Falha na comunicação. Tente novamente.');
    } finally {
      setCharging(false);
    }
  };

  const chargeCheckout = async (value: number, payMethod: 'card' | 'boleto') => {
    setCharging(true);
    setChargeError(null);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/mp/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ amount: value, method: payMethod }),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as {
        ok?: boolean;
        initPoint?: string;
        message?: string;
      };
      if (res.ok && data.ok && data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        setChargeError(data.message ?? 'Não foi possível iniciar o pagamento.');
      }
    } catch {
      setChargeError('Falha na comunicação. Tente novamente.');
    } finally {
      setCharging(false);
    }
  };

  const charge = async () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (!value || value < 5) {
      setChargeError('Valor mínimo de R$ 5,00.');
      return;
    }
    if (method === 'pix') return chargePix(value);
    return chargeCheckout(value, method);
  };

  const copyPix = async () => {
    if (!copiaECola) return;
    try {
      await navigator.clipboard.writeText(copiaECola);
      push('Código PIX copiado.', 'ok');
    } catch {
      push('Não foi possível copiar.', 'err');
    }
  };

  return (
    <AppShell header="Perfil">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="card-glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-zinc-100">Dados da conta</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Nome</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input-dark" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">E-mail</label>
                <input value={profile?.email ?? user?.email ?? ''} disabled className="input-dark opacity-60" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Telefone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" className="input-dark" />
              </div>
              <button onClick={save} className="btn-neon px-5 py-2.5 text-sm">
                Salvar alterações
              </button>
            </div>
          </div>

          <div className="card-glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-100">Saldo</h2>
              <Icon name="coin" className="h-5 w-5 text-neon-400" />
            </div>
            <p className="mt-3 text-4xl font-extrabold text-neon-500">{brl(profile?.balance ?? 0)}</p>
            <button onClick={() => setShowAdd((v) => !v)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neon-400 hover:text-neon-300">
              <Icon name="plus" className="h-4 w-4" />
              Adicionar créditos
            </button>
            {!qrCode && (
              <button onClick={() => syncPayments()} disabled={checking} className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-neon-300 disabled:opacity-50">
                <Icon name="refresh" className="h-3.5 w-3.5" />
                {checking ? 'Sincronizando…' : 'Sincronizar pagamentos ✓'}
              </button>
            )}
            {showAdd && !qrCode && (
              <div className="mt-3">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'pix', label: 'PIX', icon: 'bolt' },
                      { id: 'card', label: 'Cartão', icon: 'credit' },
                      { id: 'boleto', label: 'Boleto', icon: 'file' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                        method === m.id
                          ? 'border-neon-500/50 bg-neon-500/10 text-neon-300'
                          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      <Icon name={m.icon} className="h-3.5 w-3.5" />
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="R$ 50,00"
                    inputMode="decimal"
                    className="input-dark"
                  />
                  <button onClick={charge} disabled={charging} className="btn-neon shrink-0 px-4 py-2 text-sm disabled:opacity-50">
                    {charging ? (method === 'pix' ? 'Gerando…' : 'Ir pagar…') : 'OK'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-600">
                  {method === 'pix'
                    ? 'Recarga via PIX (mínimo R$ 5,00). O saldo entra automaticamente após a confirmação.'
                    : method === 'card'
                      ? 'Pagamento com cartão via Mercado Pago. Você será redirecionado para concluir.'
                      : 'Boleto bancário via Mercado Pago. Você será redirecionado para gerar o boleto.'}
                </p>
                {chargeError && <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{chargeError}</p>}
              </div>
            )}

            {qrCode && (
              <div className="mt-3 space-y-3">
                <div className="mx-auto w-48 rounded-xl bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="QR Code PIX" className="h-full w-full" />
                </div>
                <p className="text-center text-xs text-zinc-500">Escaneie o QR Code ou copie o código abaixo.</p>
                <div className="flex items-center gap-2">
                  <input readOnly value={copiaECola ?? ''} className="input-dark flex-1 truncate font-mono text-xs" />
                  <button onClick={copyPix} className="btn-neon shrink-0 px-3 py-2 text-xs">
                    Copiar
                  </button>
                </div>
                <p className="flex items-center justify-center gap-1.5 text-xs text-neon-400">
                  <Icon name="clock" className="h-3.5 w-3.5" />
                  Aguardando pagamento…
                </p>
                <button onClick={() => syncPayments()} disabled={checking} className="btn-neon w-full py-2 text-xs disabled:opacity-50">
                  {checking ? 'Verificando…' : 'Já paguei ✓'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-zinc-100">Histórico de transações</h2>
          {transactions.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Nenhuma transação ainda.</p>
          ) : (
            <div className="mt-4 divide-y divide-zinc-800/70">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className={`text-sm font-semibold ${transactionType(t.type).className}`}>{transactionType(t.type).label}</p>
                    <p className="text-xs text-zinc-500">
                      {dateTimeBR(t.createdAt)} • {paymentMethodLabel(t.paymentMethod)}
                    </p>
                  </div>
                  <p className={`font-bold ${t.amount > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {t.amount > 0 ? '+' : ''}
                    {brl(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function PerfilPage() {
  return (
    <RequireAuth>
      <Perfil />
    </RequireAuth>
  );
}