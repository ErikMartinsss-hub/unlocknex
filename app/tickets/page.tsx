'use client';

import { useRef, useState } from 'react';
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
import { fileToDataUrl, isAcceptedImage } from '@/lib/image';

const MAX_PHOTOS = 3;

function Tickets() {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const tickets = useTickets(profile?.uid);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      push(`Máximo de ${MAX_PHOTOS} fotos por chamado.`, 'err');
      return;
    }
    setPicking(true);
    const chosen = files.slice(0, room);
    for (const f of chosen) {
      if (!isAcceptedImage(f)) {
        push(`${f.name}: só JPG, PNG ou WebP (iPhone HEIC não é aceito).`, 'err');
        continue;
      }
      if (f.size > 8 * 1024 * 1024) {
        push(`${f.name}: imagem maior que 8MB.`, 'err');
        continue;
      }
      try {
        const data = await fileToDataUrl(f);
        setPhotos((p) => [...p, data]);
      } catch {
        push(`Não consegui processar ${f.name}.`, 'err');
      }
    }
    if (files.length > room) {
      push(`Máximo de ${MAX_PHOTOS} fotos por chamado (adicionadas ${room}).`, 'err');
    }
    setPicking(false);
  };

  const removePhoto = (idx: number) => setPhotos((p) => p.filter((_, i) => i !== idx));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && photos.length === 0) {
      push('Descreva o problema ou anexe uma foto.', 'err');
      return;
    }
    setBusy(true);
    try {
      const db = getDbFirebase();
      const base = {
        userId: user!.uid,
        subject: subject.trim(),
        status: 'aberto' as const,
        priority: 'normal' as const,
        closedAt: null,
        createdAt: Date.now(),
      };
      const ticketRef = await addDoc(collection(db, 'tickets'), photos.length ? { ...base, images: photos } : base);
      await addDoc(collection(db, 'ticketMessages'), {
        ticketId: ticketRef.id,
        userId: user!.uid,
        body: message.trim(),
        createdAt: Date.now(),
      });
      setSubject('');
      setMessage('');
      setPhotos([]);
      push('Chamado aberto. Responderemos em breve.', 'ok');
    } catch {
      push('Não foi possível abrir o chamado (fotos grandes demais?).', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell header="Tickets">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-zinc-100">Abrir chamado</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Precisa de ajuda com um pedido? Fale com o suporte — se tiver um problema, anexe fotos.
          </p>
          <form onSubmit={create} className="mt-5 space-y-4">
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto (ex.: Pedido #abc123 não concluiu)"
              className="input-dark"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva o problema…"
              rows={3}
              className="input-dark resize-none"
            />
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={pickPhotos}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy || picking || photos.length >= MAX_PHOTOS}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-400 transition hover:border-neon-500/50 hover:text-neon-400 disabled:opacity-50"
              >
                <Icon name="plus" className="h-4 w-4" />
                {picking ? 'Processando…' : `Anexar fotos (${photos.length}/${MAX_PHOTOS})`}
              </button>
              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((src, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Foto ${i + 1}`}
                        className="h-16 w-16 rounded-lg border border-zinc-800 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        title="Remover foto"
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={busy || picking} className="btn-neon inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60">
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
              {t.images && t.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.images.map((src, i) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={i}
                      src={src}
                      alt={`Foto ${i + 1} do chamado`}
                      title="Abrir foto"
                      onClick={() => window.open(src, '_blank')}
                      className="h-14 w-14 cursor-pointer rounded-lg border border-zinc-800 object-cover transition hover:border-neon-500/50"
                    />
                  ))}
                </div>
              )}
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