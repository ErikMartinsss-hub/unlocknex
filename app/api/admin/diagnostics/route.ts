import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/**
 * Diagnóstico do banco (só admin):
 *  - O projeto que o SITE (cliente) lê: NEXT_PUBLIC_FIREBASE_PROJECT_ID.
 *  - O projeto que o SERVIDOR (puxar/gravar) usa: project_id da conta de
 *    serviço configurada nas env vars.
 *  - A contagem REAL de serviços no projeto do servidor.
 * Se os dois projetos forem diferentes, o puxar "funciona" mas nada aparece
 * no site — é o caso mais comum de "contador não sobe".
 */
export async function GET(req: NextRequest) {
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

  // --- Projeto do SERVIDOR (onde o puxar grava) ---
  let serverProject = '';
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
      const json = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'));
      serverProject = String(json.project_id ?? '');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
      const json = JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8'));
      serverProject = String(json.project_id ?? '');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      serverProject = String(json.project_id ?? '');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      serverProject = process.env.FIREBASE_PROJECT_ID;
    }
  } catch {
    serverProject = '(não foi possível ler a conta de serviço)';
  }

  // --- Contagem REAL de serviços no projeto do servidor ---
  let serverCount = -1;
  try {
    const col = db.collection('services');
    try {
      const c = await col.count().get();
      serverCount = c.data().count;
    } catch {
      const snap = await col.select('productUuid').get();
      serverCount = snap.size;
    }
  } catch {
    serverCount = -1;
  }

  const clientProject = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '').trim();

  return NextResponse.json({
    ok: true,
    clientProject,
    serverProject,
    serverCount,
    projectsMatch: Boolean(clientProject && serverProject && clientProject === serverProject),
  });
}