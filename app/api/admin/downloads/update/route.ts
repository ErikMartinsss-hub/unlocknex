import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import type { DownloadCategory } from '@/lib/types';

export const runtime = 'nodejs';

/**
 * Atualiza um item da Central de Downloads.
 * POST /api/admin/downloads/update { downloadId, url?, isActive?, name?, version?, description?, category? }
 * url: '' remove o link. Restrito a role 'admin'. Usa merge.
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

  const body = (await req.json().catch(() => null)) as {
    downloadId?: string;
    url?: string;
    isActive?: boolean;
    name?: string;
    version?: string;
    description?: string;
    category?: DownloadCategory;
  } | null;
  const downloadId = String(body?.downloadId ?? '').trim();
  if (!downloadId || downloadId.length > 60) {
    return NextResponse.json({ ok: false, message: 'Download inválido.' }, { status: 400 });
  }

  const patch: Record<string, boolean | string | FieldValue> = {};
  let clearUrl = false;

  const setText = (key: string, value: unknown, label: string, maxLen: number) => {
    if (typeof value !== 'string' || value.length > maxLen) {
      throw new Error(`${label} inválido.`);
    }
    const v = value.trim();
    if (v !== '') patch[key] = v;
  };

  try {
    if (body?.url !== undefined) {
      if (typeof body.url !== 'string' || body.url.length > 500) {
        return NextResponse.json({ ok: false, message: 'URL inválida.' }, { status: 400 });
      }
      const url = body.url.trim();
      if (url === '') {
        clearUrl = true;
      } else {
        if (!/^https?:\/\/.+/.test(url)) {
          return NextResponse.json({ ok: false, message: 'URL inválida.' }, { status: 400 });
        }
        patch.url = url;
      }
    }
    if (body?.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ ok: false, message: 'Disponibilidade inválida.' }, { status: 400 });
      }
      patch.isActive = body.isActive;
    }
    if (body?.name !== undefined) setText('name', body.name, 'Nome', 120);
    if (body?.version !== undefined) setText('version', body.version, 'Versão', 40);
    if (body?.description !== undefined) setText('description', body.description, 'Descrição', 300);
    if (body?.category !== undefined) {
      if (body.category !== 'ferramenta' && body.category !== 'driver') {
        return NextResponse.json({ ok: false, message: 'Categoria inválida.' }, { status: 400 });
      }
      patch.category = body.category;
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Valor inválido.' },
      { status: 400 }
    );
  }

  if (Object.keys(patch).length === 0 && !clearUrl) {
    return NextResponse.json({ ok: false, message: 'Nada para atualizar.' }, { status: 400 });
  }

  const ref = db.doc(`downloads/${downloadId}`);
  const snap = await ref.get().catch(() => null);
  if (!snap?.exists) return NextResponse.json({ ok: false, message: 'Download não encontrado.' }, { status: 404 });
  if (clearUrl) patch.url = FieldValue.delete();
  await ref.set(patch, { merge: true });
  return NextResponse.json({ ok: true, downloadId });
}