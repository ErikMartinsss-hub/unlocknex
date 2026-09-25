import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { confirmAndCredit } from '@/lib/mp-confirm';

export const runtime = 'nodejs';

/**
 * Reconciliação: o cliente chama quando o PIX foi pago mas o saldo ainda não
 * creditou (webhook perdido/rejeitado). Varre as cobranças pendentes do usuário,
 * consulta o status real no Mercado Pago e credita as aprovadas (idempotente).
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
  const candidates: { id: string; mpPaymentId: string | number }[] = [];
  try {
    const snap = await db.collection('payments').where('userId', '==', claims.uid).limit(20).get();
    snap.forEach((d) => {
      const data = d.data();
      if (data?.status === 'pending' && data?.provider === 'mercadopago' && data?.mpPaymentId) {
        candidates.push({ id: d.id, mpPaymentId: data.mpPaymentId });
      }
    });
  } catch {
    return NextResponse.json({ ok: false, message: 'Erro ao consultar pagamentos.' }, { status: 500 });
  }

  const credited: string[] = [];
  const alreadyConfirmed: string[] = [];
  const stillPending: string[] = [];
  let lastError: string | null = null;

  for (const c of candidates.slice(0, 5)) {
    const res = await confirmAndCredit(c.id, c.mpPaymentId);
    if (res.ok && res.alreadyConfirmed) alreadyConfirmed.push(c.id);
    else if (res.ok) credited.push(c.id);
    else if (res.status && res.status !== 'approved') stillPending.push(c.id);
    else lastError = res.error ?? 'erro';
  }

  return NextResponse.json({ ok: true, credited, alreadyConfirmed, stillPending, error: lastError });
}