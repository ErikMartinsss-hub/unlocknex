'use client';

import { useMemo, useState } from 'react';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';
import { useDownloads, useServices } from '@/lib/hooks';
import { brl } from '@/lib/format';

function Admin() {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rulesBusy, setRulesBusy] = useState(false);
  const [rulesResult, setRulesResult] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  // --- Painel de preços ---
  const services = useServices();
  const [busca, setBusca] = useState('');
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});
  const [linksImg, setLinksImg] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<Record<string, boolean>>({});

  // --- Central de Downloads ---
  const downloads = useDownloads();
  const [dlBusca, setDlBusca] = useState('');
  const [dlLinks, setDlLinks] = useState<Record<string, string>>({});
  const [dlImgs, setDlImgs] = useState<Record<string, string>>({});
  const [dlSalvando, setDlSalvando] = useState<Record<string, boolean>>({});
  const [dlBusy, setDlBusy] = useState(false);
  const [dlResult, setDlResult] = useState<string | null>(null);

  // --- Créditos de teste ---
  const [credEmail, setCredEmail] = useState('');
  const [credAmount, setCredAmount] = useState('');
  const [credBusy, setCredBusy] = useState(false);
  const [credResult, setCredResult] = useState<string | null>(null);

  const dlFiltrados = useMemo(() => {
    const q = dlBusca.trim().toLowerCase();
    if (!q) return downloads;
    return downloads.filter(
      (d) => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
    );
  }, [downloads, dlBusca]);

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

  const atualizarDownload = async (downloadId: string, patch: { url?: string; imageUrl?: string; isActive?: boolean }) => {
    setDlSalvando((m) => ({ ...m, [downloadId]: true }));
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/downloads/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ downloadId, ...patch }),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        push('Salvo!', 'ok');
        setDlLinks((m) => {
          const c = { ...m };
          delete c[downloadId];
          return c;
        });
        setDlImgs((m) => {
          const c = { ...m };
          delete c[downloadId];
          return c;
        });
      } else {
        push(data.message ?? 'Falha ao salvar.', 'err');
      }
    } catch {
      push('Falha na comunicação. Tente novamente.', 'err');
    } finally {
      setDlSalvando((m) => ({ ...m, [downloadId]: false }));
    }
  };

  const salvarDownload = (downloadId: string) => {
    const url = (dlLinks[downloadId] ?? '').trim();
    const img = (dlImgs[downloadId] ?? '').trim();
    const patch: { url?: string; imageUrl?: string } = {};
    if (url !== '') {
      if (!/^https?:\/\/.+/.test(url)) {
        push('URL do download inválida (precisa começar com http:// ou https://).', 'err');
        return;
      }
      patch.url = url;
    }
    if (img !== '') {
      if (!/^https?:\/\/.+/.test(img)) {
        push('URL da capa inválida (precisa começar com http:// ou https://).', 'err');
        return;
      }
      patch.imageUrl = img;
    }
    if (Object.keys(patch).length === 0) {
      push('Cole o link do download ou da capa primeiro.', 'err');
      return;
    }
    atualizarDownload(downloadId, patch);
  };

  const syncDownloads = async () => {
    setDlBusy(true);
    setDlResult(null);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/sync-downloads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as {
        ok?: boolean;
        downloads?: number;
        message?: string;
      };
      if (res.ok && data.ok) {
        setDlResult(`Downloads sincronizados: ${data.downloads} itens.`);
        push('Central de downloads sincronizada.', 'ok');
      } else {
        setDlResult(data.message ?? 'Falha na sincronização.');
        push(data.message ?? 'Falha na sincronização.', 'err');
      }
    } catch {
      setDlResult('Falha na comunicação. Tente novamente.');
    } finally {
      setDlBusy(false);
    }
  };

  const publishRules = async () => {
    setRulesBusy(true);
    setRulesResult(null);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/sync-rules', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        setRulesResult(data.message ?? 'Regras publicadas.');
        push('Regras do banco publicadas!', 'ok');
      } else {
        setRulesResult(data.message ?? 'Falha ao publicar regras.');
        push(data.message ?? 'Falha ao publicar regras.', 'err');
      }
    } catch {
      setRulesResult('Falha na comunicação. Tente novamente.');
    } finally {
      setRulesBusy(false);
    }
  };

  const addCredits = async () => {
    if (!credEmail.trim()) {
      push('Digite o e-mail da conta.', 'err');
      return;
    }
    const v = Number(credAmount);
    if (!Number.isFinite(v) || v <= 0) {
      push('Digite um valor maior que zero (ex.: 50).', 'err');
      return;
    }
    setCredBusy(true);
    setCredResult(null);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ email: credEmail.trim(), amount: v }),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        setCredResult(data.message ?? 'Créditos adicionados.');
        push('Créditos adicionados!', 'ok');
        setCredAmount('');
      } else {
        setCredResult(data.message ?? 'Falha ao adicionar créditos.');
        push(data.message ?? 'Falha ao adicionar créditos.', 'err');
      }
    } catch {
      setCredResult('Falha na comunicação. Tente novamente.');
    } finally {
      setCredBusy(false);
    }
  };

  return (
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
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={sync} disabled={busy} className="btn-neon px-5 py-2.5 text-sm disabled:opacity-50">
                {busy ? 'Sincronizando…' : 'Sincronizar catálogo'}
              </button>
              <button
                onClick={publishRules}
                disabled={rulesBusy}
                className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-neon-500/50 hover:text-neon-400 disabled:opacity-50"
              >
                {rulesBusy ? 'Publicando…' : 'Publicar regras do banco'}
              </button>
            </div>
          )}
          {result && <p className="mt-3 text-sm text-zinc-300">{result}</p>}
          {rulesResult && <p className="mt-2 text-sm text-zinc-300">{rulesResult}</p>}
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

        {isAdmin && (
          <div className="card-glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-zinc-100">Central de Downloads</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Sincroniza o catálogo do código e preenche os links e capas dos programas. O que tiver
              link salvo aparece na página Downloads para os técnicos. ({downloads.length} itens)
            </p>
            <button onClick={syncDownloads} disabled={dlBusy} className="btn-neon mt-4 px-5 py-2.5 text-sm disabled:opacity-50">
              {dlBusy ? 'Sincronizando…' : 'Sincronizar downloads'}
            </button>
            {dlResult && <p className="mt-3 text-sm text-zinc-300">{dlResult}</p>}

            <input
              value={dlBusca}
              onChange={(e) => setDlBusca(e.target.value)}
              placeholder="Buscar download…"
              className="input-dark mt-4"
            />
            <div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {dlFiltrados.map((d) => (
                <div
                  key={d.id}
                  className={`flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 ${d.isActive === false ? 'opacity-50' : ''}`}
                >
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-medium text-zinc-200">{d.name}</p>
                    <p className="text-xs text-zinc-500">
                      <span className={`font-semibold ${d.category === 'driver' ? 'text-cyan-400' : 'text-neon-400'}`}>
                        {d.category === 'driver' ? 'Driver' : 'Ferramenta'}
                      </span>
                      {d.version && <> • v{d.version}</>}
                      {d.isActive === false && ' • oculto'}
                      {!d.url && ' • sem link'}
                    </p>
                  </div>
                  <input
                    value={dlLinks[d.id] ?? ''}
                    onChange={(e) => setDlLinks((m) => ({ ...m, [d.id]: e.target.value }))}
                    placeholder={d.url || 'Cole o link do download…'}
                    inputMode="url"
                    className="input-dark w-full font-mono text-xs"
                  />
                  <div className="flex w-full items-center gap-2">
                    {d.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={d.imageUrl} alt="" className="h-8 w-14 shrink-0 rounded-md border border-zinc-800 object-cover" />
                    ) : null}
                    <input
                      value={dlImgs[d.id] ?? ''}
                      onChange={(e) => setDlImgs((m) => ({ ...m, [d.id]: e.target.value }))}
                      placeholder={d.imageUrl || 'URL da capa (opcional)…'}
                      inputMode="url"
                      className="input-dark w-full font-mono text-xs"
                    />
                  </div>
                  <button
                    onClick={() => salvarDownload(d.id)}
                    disabled={!!dlSalvando[d.id]}
                    className="btn-neon shrink-0 px-3 py-2 text-xs disabled:opacity-50"
                  >
                    {dlSalvando[d.id] ? '…' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => atualizarDownload(d.id, { isActive: !(d.isActive !== false) })}
                    disabled={!!dlSalvando[d.id]}
                    title={d.isActive === false ? 'Exibir na página' : 'Ocultar da página'}
                    className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
                  >
                    {d.isActive === false ? 'Exibir' : 'Ocultar'}
                  </button>
                </div>
              ))}
              {dlFiltrados.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-500">Nenhum download encontrado.</p>
              )}
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="card-glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-zinc-100">Créditos de teste</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Encontra a conta pelo e-mail e adiciona créditos direto no saldo — pra testar
              pagamentos sem pagar PIX toda vez. Fica registrado no histórico do usuário
              como "Créditos de teste".
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px_auto]">
              <input
                type="email"
                value={credEmail}
                onChange={(e) => setCredEmail(e.target.value)}
                placeholder="E-mail da conta…"
                className="input-dark"
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={credAmount}
                onChange={(e) => setCredAmount(e.target.value)}
                placeholder="R$ 0,00"
                className="input-dark"
              />
              <button
                onClick={addCredits}
                disabled={credBusy}
                className="btn-neon px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {credBusy ? 'Adicionando…' : 'Adicionar créditos'}
              </button>
            </div>
            {credResult && <p className="mt-3 text-sm text-zinc-300">{credResult}</p>}
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
