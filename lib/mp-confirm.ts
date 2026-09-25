import { getAdminDb } from '@/lib/firebase-admin';
import { getMpPayment } from '@/lib/mercadopago';

export type ConfirmResult =
  | { ok: true; alreadyConfirmed?: boolean }
  | { ok: false; status?: string; statusDetail?: string; error?: string };

/**
 * Confirma uma cobrança UnlockNex a partir do pagamento no Mercado Pago e credita
 * o saldo do usuário de forma idempotente (via transação Firestore).
 *
 * Usado pelo webhook (`/api/pix/webhook`) e pela reconciliação (`/api/pix/status`),
 * para que o crédito aconteça mesmo se o webhook não chegar.
 */
export async function confirmAndCredit(
  correlationId: string,
  mpPaymentId: string | number,
  knownPayment?: { status?: string; status_detail?: string; id?: number | string }
): Promise<ConfirmResult> {
  const db = getAdminDb();
  const payRef = db.doc(`payments/${correlationId}`);

  const paySnap = await payRef.get().catch(() => null);
  if (!paySnap?.exists) return { ok: false, error: 'not-found' };
  const data = paySnap.data() as { userId?: string; amount?: number; status?: string; method?: string };
  if (data.status === 'confirmed') return { ok: true, alreadyConfirmed: true };

  let payment = knownPayment;
  if (!payment || !payment.status) {
    try {
      payment = await getMpPayment(mpPaymentId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Exceção: pagamento não existe no MP (cobrança órfã de conta antiga ou
      // expirada/removida). Marca como expirada para não poluir futuras
      // sincronizações e retorna status 'missing' (não é erro para o usuário).
      if (/Payment not found|not_found|"status":404/i.test(msg)) {
        await payRef
          .set({ status: 'expired', expiredAt: Date.now(), expiredReason: 'mp-payment-missing' }, { merge: true })
          .catch(() => {});
        return { ok: false, status: 'missing', error: 'mp-payment-missing' };
      }
      return { ok: false, error: msg };
    }
  }
  if (payment.status !== 'approved' || payment.status_detail !== 'accredited') {
    return { ok: false, status: payment.status ?? 'unknown', statusDetail: payment.status_detail };
  }
  if (!data.userId || !data.amount) return { ok: false, error: 'missing-data' };
  const method = data.method === 'card' || data.method === 'boleto' ? data.method : 'pix';

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(payRef);
      if (snap.exists && snap.data()?.status === 'confirmed') return;
      const userSnap = await tx.get(db.doc(`users/${data.userId!}`));
      if (!userSnap.exists) throw new Error('user-missing');
      const balance = Number(userSnap.data()?.balance ?? 0);
      tx.set(payRef, { status: 'confirmed', confirmedAt: Date.now() }, { merge: true });
      tx.update(db.doc(`users/${data.userId!}`), { balance: balance + data.amount! });
      tx.set(db.collection('transactions').doc(), {
        userId: data.userId,
        type: 'deposit',
        amount: data.amount,
        paymentMethod: method,
        provider: 'mercadopago',
        reference: correlationId,
        mpPaymentId: payment.id ?? String(mpPaymentId),
        createdAt: Date.now(),
        by: 'mp-webhook',
      });
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  return { ok: true };
}