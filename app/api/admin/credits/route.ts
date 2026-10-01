import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AMOUNT_MAX = 5000;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Adiciona créditos de teste ao saldo de uma conta (pelo e-mail).
 * POST /api/admin/credits — restrito a usuários com role 'admin'.
 * Como roda no servidor (Admin SDK), dispensa mudança nas regras do Firestore.
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

  let email = '';
  let amount = 0;
  try {
    const body = (await req.json()) as { email?: unknown; amount?: unknown };
    email = String(body.email ?? '').trim().toLowerCase();
    amount = Number(body.amount);
  } catch {
    return NextResponse.json({ ok: false, message: 'Envie o e-mail e o valor.' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, message: 'E-mail inválido.' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { ok: false, message: 'Valor inválido — use um número maior que zero (ex.: 50).' },
      { status: 400 }
    );
  }
  if (amount > AMOUNT_MAX) {
    return NextResponse.json(
      { ok: false, message: `Máximo de R$ ${AMOUNT_MAX.toFixed(2)} por adição.` },
      { status: 400 }
    );
  }
  const parsed = round2(amount);

  const snap = await db.collection('users').where('email', '==', email).limit(1).get();
  if (snap.empty) {
    return NextResponse.json({ ok: false, message: 'Nenhum usuário encontrado com esse e-mail.' }, { status: 404 });
  }
  const userDoc = snap.docs[0];
  const userData = userDoc.data() as { name?: string; balance?: number };

  let balance: number;
  try {
    balance = await db.runTransaction(async (tx) => {
      const ref = db.doc(`users/${userDoc.id}`);
      const u = await tx.get(ref);
      const current = Number(u.data()?.balance ?? 0);
      const next = round2(current + parsed);
      tx.update(ref, { balance: next });
      tx.set(db.collection('transactions').doc(), {
        userId: userDoc.id,
        amount: parsed,
        type: 'credit',
        status: 'concluido',
        paymentMethod: 'teste',
        reference: null,
        createdAt: Date.now(),
        by: claims.uid,
        note: 'Créditos de teste adicionados pelo administrador',
      });
      return next;
    });
  } catch (e) {
    console.error('[credits] falha ao adicionar créditos:', e);
    return NextResponse.json({ ok: false, message: 'Falha ao adicionar os créditos. Tente novamente.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: `Créditos adicionados para ${userData.name ?? email}. Novo saldo: R$ ${balance.toFixed(2)}.`,
    user: { uid: userDoc.id, name: userData.name ?? '', email, balance },
  });
}