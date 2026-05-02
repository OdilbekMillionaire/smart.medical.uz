import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { compactObject, createServerNotification, notifyAdmins, writeAuditLog } from '@/lib/server-events';
import { z } from 'zod';
import type { Document } from '@/types';

type RouteContext = { params: Promise<{ id: string }> };

const UpdateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  type: z.string().trim().min(1).max(80).optional(),
  content: z.string().max(100000).optional(),
  status: z.enum(['draft', 'pending_review', 'approved', 'rejected']).optional(),
  reviewNote: z.string().max(10000).optional(),
  aiOpinion: z.string().max(10000).optional(),
  storageUrl: z.string().url().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const db = getAdminDb();
    const snap = await db.collection('documents').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const doc = { id: snap.id, ...snap.data() } as Document;
    if (auth.role !== 'admin' && doc.ownerId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(doc);
  } catch (err: unknown) {
    console.error('[document GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const db = getAdminDb();
    const snap = await db.collection('documents').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = snap.data() as Document;

    const body = await parseJson(req, UpdateDocumentSchema);
    if (body instanceof NextResponse) return body;

    // Only admin can approve/reject and write review/admin-only fields.
    if ((body.status === 'approved' || body.status === 'rejected') && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (auth.role !== 'admin' && existing.ownerId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (auth.role !== 'admin') {
      const allowedFields = new Set(['title', 'content', 'status']);
      if (Object.keys(body).some((key) => !allowedFields.has(key))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (existing.status !== 'draft') {
        return NextResponse.json({ error: 'Only draft documents can be edited' }, { status: 403 });
      }
      if (body.status && body.status !== 'pending_review') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const nextStatus = body.status;
    const updates = compactObject({
      ...body,
      updatedAt: new Date().toISOString(),
      ...(auth.role === 'admin' && body.status && ['approved', 'rejected'].includes(body.status)
        ? { reviewedBy: auth.uid }
        : {}),
    });
    await db.collection('documents').doc(id).update(updates);
    const merged = Object.assign({}, existing, updates, { id });

    const action = nextStatus
      ? `document_${nextStatus}`
      : 'document_updated';
    await writeAuditLog(auth, action, 'document', id, merged.title);

    if (nextStatus === 'pending_review') {
      await notifyAdmins({
        type: 'document_submitted',
        title: "Yangi hujjat ko'rib chiqish uchun yuborildi",
        body: merged.title,
        link: `/dashboard/documents/${id}`,
      });
    }

    if ((nextStatus === 'approved' || nextStatus === 'rejected') && existing.ownerId !== auth.uid) {
      await createServerNotification({
        userId: existing.ownerId,
        type: nextStatus === 'approved' ? 'document_approved' : 'document_rejected',
        title: nextStatus === 'approved' ? 'Hujjat tasdiqlandi' : 'Hujjat rad etildi',
        body: merged.title,
        link: `/dashboard/documents/${id}`,
      });
    }

    return NextResponse.json(merged);
  } catch (err: unknown) {
    console.error('[document PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const db = getAdminDb();
    const snap = await db.collection('documents').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = snap.data() as Document;
    if (auth.role !== 'admin' && existing.ownerId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await db.collection('documents').doc(id).delete();
    await writeAuditLog(auth, 'document_deleted', 'document', id, existing.title);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[document DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
