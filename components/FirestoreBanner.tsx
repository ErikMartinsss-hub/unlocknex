'use client';

/**
 * Aviso exibido quando a leitura do Firestore falha (o caso mais comum é o
 * botão "Publicar regras do banco" ainda não ter sido clicado no /admin —
 * sem ele, as páginas públicas ficam em "Carregando…" para sempre).
 */
export function FirestoreBanner({ error }: { error: string | null }) {
  if (!error) return null;
  const pareceRegras = /permission|denied|unauthorized|rules|falha na leitura/i.test(error);
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
      <span className="font-bold">⚠️ Não consegui carregar os serviços.</span>{' '}
      {pareceRegras ? (
        <>
          As regras públicas do banco ainda não foram publicadas: entre no{' '}
          <b className="text-amber-200">/admin</b> e clique em{' '}
          <b className="text-amber-200">"Publicar regras do banco"</b> (botão no topo, ao lado de
          "Sincronizar catálogo").
        </>
      ) : (
        <span className="text-amber-200">{error}</span>
      )}
    </div>
  );
}