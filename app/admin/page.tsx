'use client';

import { useEffect, useMemo, useState } from 'react';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';
import { useCategories, useDownloads, useServices } from '@/lib/hooks';
import { brl } from '@/lib/format';

function Admin() {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rulesBusy, setRulesBusy] = useState(false);
  const [rulesResult, setRulesResult] = useState<string | null>(null);
  const [limparBusy, setLimparBusy] = useState(false);

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

  // --- Catálogo da API (adicionar serviços um a um) ---
  type ApiProd = { uuid: string; name: string; price: number; imageUrl: string; field: string };
  const [catalog, setCatalog] = useState<ApiProd[]>([]);
  const [catBusy, setCatBusy] = useState(false);
  const [catErro, setCatErro] = useState<string | null>(null);
  const [apiBusca, setApiBusca] = useState('');
  const [apiPrecos, setApiPrecos] = useState<Record<string, string>>({});
  const [apiDestino, setApiDestino] = useState<Record<string, string>>({});
  const [apiAdding, setApiAdding] = useState<Record<string, 'remote' | 'servico'>>({});
  const [removendo, setRemovendo] = useState<Record<string, boolean>>({});
  const [mostrarNovo, setMostrarNovo] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoCategoria, setNovoCategoria] = useState('cat-frp');
  const [novoPreco, setNovoPreco] = useState('');
  const [novoPrazo, setNovoPrazo] = useState('');
  const [novoDesc, setNovoDesc] = useState('');
  const [novoImg, setNovoImg] = useState('');
  const [novoBusy, setNovoBusy] = useState(false);
  const [licPreco, setLicPreco] = useState('');
  const [licPrazo, setLicPrazo] = useState('');
  const [licBusy, setLicBusy] = useState(false);

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

  const limparCatalogo = async () => {
    const total = services.length;
    if (total === 0) {
      push('O catálogo já está vazio.', 'err');
      return;
    }
    const confirmou = window.confirm(
      `Apagar TODOS os ${total} serviços do catálogo?\n\nAs páginas de Serviços e Aluguel ficam vazias até você adicionar de novo, um por um, pelo painel.`
    );
    if (!confirmou) return;
    setLimparBusy(true);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/services/clear', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as {
        ok?: boolean;
        removed?: number;
        message?: string;
      };
      if (res.ok && data.ok) {
        push(`Catálogo limpo: ${data.removed} serviços removidos.`, 'ok');
      } else {
        push(data.message ?? 'Falha ao limpar o catálogo.', 'err');
      }
    } catch {
      push('Falha na comunicação. Tente novamente.', 'err');
    } finally {
      setLimparBusy(false);
    }
  };

  const removerServico = async (id: string, name: string) => {
    if (!window.confirm(`Remover "${name}" das páginas?`)) return;
    setRemovendo((m) => ({ ...m, [id]: true }));
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/services/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ ids: [id] }),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as {
        ok?: boolean;
        removed?: number;
        message?: string;
      };
      if (res.ok && data.ok) {
        push(`Removido: ${name}`, 'ok');
      } else {
        push(data.message ?? 'Falha ao remover.', 'err');
      }
    } catch {
      push('Falha na comunicação. Tente novamente.', 'err');
    } finally {
      setRemovendo((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    }
  };

  const adicionarManual = async () => {
    const name = novoNome.trim();
    const price = Number(novoPreco);
    if (!name) {
      push('Dê um nome ao serviço.', 'err');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      push('Defina um preço válido.', 'err');
      return;
    }
    setNovoBusy(true);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/services/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          name,
          categoryId: novoCategoria,
          price,
          deliveryTime: novoPrazo.trim() || undefined,
          description: novoDesc.trim() || undefined,
          imageUrl: novoImg.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as {
        ok?: boolean;
        message?: string;
      };
      if (res.ok && data.ok) {
        push(data.message ?? `Adicionado: ${name}`, 'ok');
        setNovoNome('');
        setNovoPreco('');
        setNovoPrazo('');
        setNovoDesc('');
        setNovoImg('');
        setMostrarNovo(false);
      } else {
        push(data.message ?? 'Falha ao adicionar.', 'err');
      }
    } catch {
      push('Falha na comunicação. Tente novamente.', 'err');
    } finally {
      setNovoBusy(false);
    }
  };

  const puxarLicencas = async () => {
    const price = Number(licPreco);
    if (!Number.isFinite(price) || price <= 0) {
      push('Defina o preço padrão das licenças.', 'err');
      return;
    }
    setLicBusy(true);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/services/pull-licenca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ price, deliveryTime: licPrazo.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as {
        ok?: boolean;
        added?: string[];
        skipped?: number;
        message?: string;
      };
      if (res.ok && data.ok) {
        const nomes = (data.added ?? []).slice(0, 3).join(', ');
        if ((data.added ?? []).length > 0) {
          const resto = (data.added ?? []).length > 3 ? ` (+${data.added!.length - 3} mais)` : '';
          push(`Licenças adicionadas (${data.added!.length}): ${nomes}${resto}${data.skipped ? ` • ${data.skipped} já existiam` : ''}`, 'ok');
        } else if ((data.skipped ?? 0) > 0) {
          push(`${data.skipped} produtos de licença já estavam cadastrados.`, 'ok');
        } else {
          push(data.message ?? 'Nenhum produto de licença encontrado na API.', 'err');
        }
        setLicPreco('');
        setLicPrazo('');
      } else {
        push(data.message ?? 'Falha ao puxar licenças.', 'err');
      }
    } catch {
      push('Falha na comunicação. Tente novamente.', 'err');
    } finally {
      setLicBusy(false);
    }
  };

  const carregarCatalogo = async () => {
    setCatBusy(true);
    setCatErro(null);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/admin/catalog', { headers: { Authorization: `Bearer ${idToken}` } });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        products?: ApiProd[];
        message?: string;
      } | null;
      if (res.ok && data?.ok) {
        setCatalog(data.products ?? []);
        setApiPrecos((m) => {
          const next = { ...m };
          (data.products ?? []).forEach((p) => {
            if (!(p.uuid in next)) next[p.uuid] = p.price ? String(p.price) : '';
          });
          return next;
        });
      } else {
        setCatErro(data?.message ?? 'Falha ao carregar o catálogo.');
      }
    } catch {
      setCatErro('Falha na comunicação. Tente novamente.');
    } finally {
      setCatBusy(false);
    }
  };

  useEffect(() => {
    if (isAdmin) carregarCatalogo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const adicionarApi = async (p: ApiProd, categoryId: string) => {
    const price = Number(apiPrecos[p.uuid]);
    if (!Number.isFinite(price) || price <= 0) {
      push(`Defina o preço de "${p.name}".`, 'err');
      return;
    }
    const destino: 'remote' | 'servico' = categoryId === 'cat-remote' ? 'remote' : 'servico';
    setApiAdding((m) => ({ ...m, [p.uuid]: destino }));
    try {
      const idToken = await user!.getIdToken();
      const apiField = categoryId === 'cat-remote' ? 'Quantity' : p.field || 'Serial';
      const res = await fetch('/api/admin/services/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ uuid: p.uuid, name: p.name, price, categoryId, apiField, imageUrl: p.imageUrl }),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        push(`Adicionado: ${p.name}`, 'ok');
      } else {
        push(data.message ?? 'Falha ao adicionar.', 'err');
      }
    } catch {
      push('Falha na comunicação. Tente novamente.', 'err');
    } finally {
      setApiAdding((m) => {
        const c = { ...m };
        delete c[p.uuid];
        return c;
      });
    }
  };

  const categorias = useCategories();
  const catServicos = categorias.filter((c) => c.id !== 'cat-remote');

  const existeUuid = useMemo(() => {
    const s = new Set<string>();
    services.forEach((sv) => {
      if (sv.productUuid) s.add(sv.productUuid);
    });
    return s;
  }, [services]);

  const catalogFiltrado = useMemo(() => {
    const q = apiBusca.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((p) => p.name.toLowerCase().includes(q));
  }, [catalog, apiBusca]);

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
              <button
                onClick={limparCatalogo}
                disabled={limparBusy}
                title="Apaga todos os serviços do catálogo"
                className="rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:border-red-500/60 hover:bg-red-500/10 disabled:opacity-50"
              >
                {limparBusy ? 'Limpando…' : 'Limpar tudo'}
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
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setMostrarNovo((v) => !v)}
                className="btn-neon px-4 py-2.5 text-sm"
              >
                {mostrarNovo ? 'Cancelar' : '+ Adicionar serviço'}
              </button>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar serviço…"
                className="input-dark flex-1 basis-52"
              />
            </div>
            {mostrarNovo && (
              <div className="mt-4 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Nome do serviço…"
                    className="input-dark sm:col-span-2"
                  />
                  <select
                    value={novoCategoria}
                    onChange={(e) => setNovoCategoria(e.target.value)}
                    className="input-dark"
                    title="Página onde o serviço vai aparecer"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        Página: {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={novoPreco}
                    onChange={(e) => setNovoPreco(e.target.value)}
                    placeholder="Preço R$"
                    inputMode="decimal"
                    className="input-dark"
                  />
                  <input
                    value={novoPrazo}
                    onChange={(e) => setNovoPrazo(e.target.value)}
                    placeholder="Prazo (ex.: Instantâneo)"
                    className="input-dark"
                  />
                  <input
                    value={novoImg}
                    onChange={(e) => setNovoImg(e.target.value)}
                    placeholder="URL da imagem (opcional)"
                    inputMode="url"
                    className="input-dark"
                  />
                  <textarea
                    value={novoDesc}
                    onChange={(e) => setNovoDesc(e.target.value)}
                    placeholder="Descrição (opcional)"
                    rows={2}
                    className="input-dark sm:col-span-2"
                  />
                </div>
                <button
                  onClick={adicionarManual}
                  disabled={novoBusy}
                  className="btn-neon px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {novoBusy ? 'Adicionando…' : 'Adicionar serviço'}
                </button>
              </div>
            )}
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
                  <button
                    onClick={() => removerServico(s.id, s.name)}
                    disabled={!!salvando[s.id] || !!removendo[s.id]}
                    title="Remover este serviço das páginas"
                    className="shrink-0 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {removendo[s.id] ? '…' : 'Remover'}
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

        {isAdmin && (
          <div className="card-glass rounded-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Adicionar serviços da API</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Catálogo completo da API — em cada produto, escolha a página
                  (Aluguel ou Serviços), defina o preço e clique em Adicionar.
                  ({catalog.length} produtos)
                </p>
              </div>
              <button
                onClick={carregarCatalogo}
                disabled={catBusy}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-neon-500/50 hover:text-neon-400 disabled:opacity-50"
              >
                {catBusy ? 'Atualizando…' : 'Atualizar catálogo'}
              </button>
            </div>

            {catErro && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {catErro}
              </p>
            )}

            <div className="mt-4">
              <input
                value={apiBusca}
                onChange={(e) => setApiBusca(e.target.value)}
                placeholder="Buscar produto na API…"
                className="input-dark w-full"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/5 p-3">
              <p className="min-w-0 flex-1 basis-48 text-xs text-zinc-300">
                <span className="font-bold text-fuchsia-400">Puxar ativação de licença da API</span>{' '}
                — encontra os produtos de licença (UnlockTool Renew / Activation / License) e adiciona
                direto na página <span className="font-semibold text-zinc-100">Ativação de Licença</span>,
                com o preço e o prazo padrão abaixo.
              </p>
              <input
                value={licPreco}
                onChange={(e) => setLicPreco(e.target.value)}
                placeholder="Preço padrão R$"
                inputMode="decimal"
                className="input-dark w-28"
              />
              <input
                value={licPrazo}
                onChange={(e) => setLicPrazo(e.target.value)}
                placeholder="Prazo padrão (ex.: Até 30 min)"
                className="input-dark w-44"
              />
              <button
                onClick={puxarLicencas}
                disabled={licBusy}
                className="btn-neon px-3.5 py-2 text-xs disabled:opacity-50"
              >
                {licBusy ? 'Puxando…' : 'Puxar licenças da API'}
              </button>
            </div>

            <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {catalogFiltrado.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  {catBusy ? 'Carregando catálogo…' : 'Nenhum produto encontrado.'}
                </p>
              )}
              {catalogFiltrado.map((p) => (
                <div
                  key={p.uuid}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"
                >
                  <div className="min-w-0 flex-1 basis-52">
                    <p className="truncate text-sm font-medium text-zinc-200">{p.name}</p>
                    <p className="text-xs text-zinc-500">
                      API {p.price > 0 ? `• ${brl(p.price)}` : ''}{' '}
                      {existeUuid.has(p.uuid) ? '• ✓ já cadastrado' : ''}
                    </p>
                    <select
                      value={apiDestino[p.uuid] ?? 'cat-remote'}
                      onChange={(e) => setApiDestino((m) => ({ ...m, [p.uuid]: e.target.value }))}
                      className="input-dark mt-2 w-full text-xs"
                      title="Página onde o serviço vai aparecer"
                    >
                      <option value="cat-remote">Página: Aluguel de Ferramentas</option>
                      {catServicos.map((c) => (
                        <option key={c.id} value={c.id}>
                          Página: {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={apiPrecos[p.uuid] ?? ''}
                    onChange={(e) => setApiPrecos((m) => ({ ...m, [p.uuid]: e.target.value }))}
                    placeholder="Preço R$"
                    inputMode="decimal"
                    className="input-dark w-24"
                  />
                  <button
                    onClick={() => adicionarApi(p, apiDestino[p.uuid] ?? 'cat-remote')}
                    disabled={!!apiAdding[p.uuid]}
                    className="btn-neon px-3 py-2 text-xs disabled:opacity-50"
                  >
                    {apiAdding[p.uuid] ? '…' : '+ Adicionar'}
                  </button>
                </div>
              ))}
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
