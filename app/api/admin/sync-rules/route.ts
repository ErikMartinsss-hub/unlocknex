import { NextRequest, NextResponse } from 'next/server';
import { getSecurityRules } from 'firebase-admin/security-rules';
import { getAdminApp, getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FIRESTORE_RULES_SOURCE } from '@/lib/firestore-rules';

export const runtime = 'nodejs';

/**
 * Publica as regras do Firestore no banco (via Admin SDK).
 * POST /api/admin/sync-rules — restrito a usuários com role 'admin'.
 * Usa a fonte em lib/firestore-rules.ts (única fonte publicável em produção).
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ ok: false, message: 'Não autenticado.' }, { status: 401 });

  let claims;
  try {
    claims = await getAdminAuth().verifyIdToken(token);
  } catch {
    return NextResponse.json({ ok: false, message: 'Sessão inválida.' }, { status: 401 });
  }

  const db = getAdminDb();
  const adminSnap = await db.doc(`users/${claims.uid}`).get().catch(() => null);
  if ((adminSnap?.data() as { role?: string } | undefined)?.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Acesso restrito ao administrador.' }, { status: 403 });
  }

  try {
    await getSecurityRules(getAdminApp()).releaseFirestoreRulesetFromSource(FIRESTORE_RULES_SOURCE);
  } catch (e) {
    console.error('[sync-rules] falha ao publicar regras:', e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Falha ao publicar as regras.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: 'Regras do banco publicadas com sucesso.' });
}