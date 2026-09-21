'use client';

import { useState } from 'react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';
import { useTransactions } from '@/lib/hooks';
import { getDbFirebase } from '@/lib/firebase';
import { Icon } from '@/components/Icon';
import { brl, dateTimeBR, transactionType } from '@/lib/format';

function Perfil() {
  const { user, profile, refreshProfile } = useAuth();
  const { push } = useToast();
  const transactions = useTransactions(profile?.uid);
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');

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

  const addBalance = async () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (!value || value <= 0) return;
    try {
      const db = getDbFirebase();
      const uid = user!.uid;
      const ref = doc(db, 'users', uid);
      const cur = profile?.balance ?? 0;
      await updateDoc(ref, { balance: cur + value });
      await addDoc(collection(db, 'transactions'), {
        userId: uid,
        amount: value,
        type: 'deposit',
        status: 'concluido',
        paymentMethod: 'manual',
        reference: 'recarga',
        createdAt: Date.now(),
      });
      await refreshProfile();
      setShowAdd(false);
      setAmount('');
      push(`Créditos adicionados: ${brl(value)}`, 'ok');
    } catch {
      push('Não foi possível adicionar créditos.', 'err');
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
            {showAdd && (
              <div className="mt-3 flex gap-2">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="R$ 50,00"
                  inputMode="decimal"
                  className="input-dark"
                />
                <button onClick={addBalance} className="btn-neon shrink-0 px-4 py-2 text-sm">
                  OK
                </button>
              </div>
            )}
            <p className="mt-4 text-xs text-zinc-600">Recarga manual para testes. Em breve integração com PIX.</p>
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
                      {dateTimeBR(t.createdAt)} • {t.paymentMethod ?? 'saldo'}
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