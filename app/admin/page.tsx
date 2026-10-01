'use client';

import { useState } from 'react';
import { RequireAuth } from '@/components/Guard';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';

function Admin() {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

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
        message?: string;
      };
      if (res.ok && data.ok) {
        setResult(`Catálogo sincronizado: ${data.categories} categorias, ${data.services} serviços.`);
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
