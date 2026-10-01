'use client';

import { useMemo, useState } from 'react';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';
import { useServices } from '@/lib/hooks';
import { brl } from '@/lib/format';

function Admin() {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  // --- Painel de preços ---
  const services = useServices();
  const [busca, setBusca] = useState('');
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});
  const [linksImg, setLinksImg] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<Record<string, boolean>>({});

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [services, busca]);

  const atualizarServico = async (serviceId: string, patch: { price?: number; isActive?: boolean; imageUrl?: string }) => {
    setSalvando((m) => ({ ...m, [serviceId]: true }));
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/services/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ serviceId, ...patch }),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        push('Salvo!', 'ok');
        setRascunhos((m) => {
          const c = { ...m };
          delete c[serviceId];
          return c;
        });
        setLinksImg((m) => {
          const c = { ...m };
          delete c[serviceId];
          return c;
        });
      } else {
        push(data.message ?? 'Falha ao salvar.', 'err');
      }
    } catch {
      push('Falha na comunicação. Tente novamente.', 'err');
    } finally {
      setSalvando((m) => ({ ...m, [serviceId]: false }));
    }
  };

  const salvarLinha = (serviceId: string) => {
    const patch: { price?: number; imageUrl?: string } = {};
    const bruto = (rascunhos[serviceId] ?? '').replace(',', '.').trim();
    if (bruto !== '') {
      const valor = Number(bruto);
      if (!Number.isFinite(valor) || valor < 0) {
        push('Digite um preço válido.', 'err');
        return;
      }
      patch.price = Math.round(valor * 100) / 100;
    }
    const url = (linksImg[serviceId] ?? '').trim();
    if (url !== '') {
      if (!/^https?:\/\/.+\..+/.test(url)) {
        push('URL da imagem inválida.', 'err');
        return;
      }
      patch.imageUrl = url;
    }
    if (Object.keys(patch).length === 0) {
      push('Nada para salvar.', 'err');
      return;
    }
    atualizarServico(serviceId, patch);
  };

  const sync = async () => {
    setBusy(true);
    setResult(null);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/sync-services', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as {
        ok?: boolean;
        categories?: number;
        services?: number;
        images?: number;
        message?: string;
      };
      if (res.ok && data.ok) {
        setResult(
          `Catálogo sincronizado: ${data.categories} categorias, ${data.services} serviços` +
            (data.images ? `, ${data.images} com imagem.` : '.')
        );
        push('Catálogo sincronizado com sucesso.', 'ok');
      } else {
        setResult(data.message ?? 'Falha na sincronização.');
        push(data.message ?? 'Falha na sincronização.', 'err');
      }
    } catch {
      setResult('Falha na comunicação. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell header="Administração">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-zinc-100">Catálogo de serviços</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Copia as categorias e serviços do código para o banco de dados (o que vale na loja).
          </p>
          {!isAdmin ? (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              Sua conta não é administradora. Peça para ajustarem seu cargo (role = admin) no Firestore.
            </p>
          ) : (
            <button onClick={sync} disabled={busy} className="btn-neon mt-4 px-5 py-2.5 text-sm disabled:opacity-50">
              {busy ? 'Sincronizando…' : 'Sincronizar catálogo'}
            </button>
          )}
          {result && <p className="mt-3 text-sm text-zinc-300">{result}</p>}
        </div>

        {isAdmin && (
          <div className="card-glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-zinc-100">Preços dos serviços</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Altere o preço e salve — vale na hora para todos. Use Ocultar/Exibir
              para escolher o que aparece nas páginas. ({services.length} serviços)
            </p>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar serviço…"
              className="input-dark mt-4"
            />
            <div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {filtrados.map((s) => (
                <div
                  key={s.id}
                  className={`flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 ${s.isActive === false ? 'opacity-50' : ''}`}
                >
                  {s.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={s.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-zinc-800 object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-medium text-zinc-200">{s.name}</p>
                    <p className="text-xs text-zinc-500">
                      Atual: <span className="font-bold text-neon-400">{brl(s.price)}</span>
                      {s.isActive === false && ' • oculto'}
                    </p>
                  </div>
                  <input
                    value={rascunhos[s.id] ?? ''}
                    onChange={(e) => setRascunhos((m) => ({ ...m, [s.id]: e.target.value }))}
                    placeholder="Novo preço"
                    inputMode="decimal"
                    className="input-dark w-28"
                  />
                  <button
                    onClick={() => salvarLinha(s.id)}
                    disabled={!!salvando[s.id]}
                    className="btn-neon shrink-0 px-3 py-2 text-xs disabled:opacity-50"
                  >
                    {salvando[s.id] ? '…' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => atualizarServico(s.id, { isActive: !(s.isActive !== false) })}
                    disabled={!!salvando[s.id]}
                    title={s.isActive === false ? 'Exibir nas páginas' : 'Ocultar das páginas'}
                    className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
                  >
                    {s.isActive === false ? 'Exibir' : 'Ocultar'}
                  </button>
                  {s.imageUrl ? (
                    <button
                      onClick={() => atualizarServico(s.id, { imageUrl: '' })}
                      disabled={!!salvando[s.id]}
                      title="Remover imagem"
                      className="shrink-0 rounded-lg border border-zinc-700 px-2.5 py-2 text-xs font-semibold text-zinc-400 hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                    >
                      × img
                    </button>
                  ) : null}
                  <input
                    value={linksImg[s.id] ?? ''}
                    onChange={(e) => setLinksImg((m) => ({ ...m, [s.id]: e.target.value }))}
                    placeholder="URL da imagem/capa…"
                    inputMode="url"
                    className="input-dark w-full font-mono text-xs"
                  />
                </div>
              ))}
              {filtrados.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-500">Nenhum serviço encontrado.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth>
      <Admin />
    </RequireAuth>
  );
}
