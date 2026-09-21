'use client';

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';
import { useTickets } from '@/lib/hooks';
import { getDbFirebase } from '@/lib/firebase';
import { Icon } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';
import { dateTimeBR, ticketStatus } from '@/lib/format';

function Tickets() {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const tickets = useTickets(profile?.uid);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const db = getDbFirebase();
      const ticketRef = await addDoc(collection(db, 'tickets'), {
        userId: user!.uid,
        subject: subject.trim(),
        status: 'aberto',
        priority: 'normal',
        closedAt: null,
        createdAt: Date.now(),
      });
      await addDoc(collection(db, 'ticketMessages'), {
        ticketId: ticketRef.id,
        userId: user!.uid,
        body: message.trim(),
        createdAt: Date.now(),
      });
      setSubject('');
      setMessage('');
      push('Chamado aberto. Responderemos em breve.', 'ok');
    } catch {
      push('Não foi possível abrir o chamado.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell header="Tickets">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-zinc-100">Abrir chamado</h2>
          <p className="mt-1 text-sm text-zinc-500">Precisa de ajuda com um pedido? Fale com o suporte.</p>
          <form onSubmit={create} className="mt-5 space-y-4">
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto (ex.: Pedido #abc123 não concluiu)"
              className="input-dark"
            />
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva o problema…"
              rows={3}
              className="input-dark resize-none"
            />
            <button type="submit" disabled={busy} className="btn-neon inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60">
              <Icon name="chat" className="h-4 w-4" />
              {busy ? 'Abrindo…' : 'Abrir chamado'}
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {tickets.length === 0 && (
            <div className="card-glass rounded-2xl p-10 text-center text-sm text-zinc-500">
              Nenhum chamado aberto. Estamos sempre à disposição.
            </div>
          )}
          {tickets.map((t) => (
            <div key={t.id} className="card-glass rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400">
                    <Icon name="ticket" className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-100">{t.subject}</p>
                    <p className="text-xs text-zinc-500">
                      #{t.id.slice(0, 6)} • {dateTimeBR(t.createdAt)} • Prioridade {t.priority}
                    </p>
                  </div>
                </div>
                <StatusBadge info={ticketStatus(t.status)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function TicketsPage() {
  return (
    <RequireAuth>
      <Tickets />
    </RequireAuth>
  );
}