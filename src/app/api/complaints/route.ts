import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, notifyAdmins, writeAuditLog } from '@/lib/server-events';
import type { Complaint } from '@/types';

const ComplaintPayloadSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  complainantName: z.string().trim().min(1).max(200),
  complainantPhone: z.string().trim().max(80).optional(),
  subject: z.string().trim().min(1).max(250),
  description: z.string().trim().min(1).max(10000),
  category: z.enum(['service', 'staff', 'billing', 'facility', 'other']),
  priority: z.enum(['low', 'medium', 'high']),
});

const UpdateComplaintSchema = z.object({
  id: z.string().trim().min(1).max(128),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']),
  resolution: z.string().trim().max(10000).optional(),
});

function canAccess(auth: { uid: string; role: string }, item: Complaint) {
  return auth.role === 'admin' || item.clinicId === auth.uid;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    let snapshot;
    if (auth.role === 'admin') {
      snapshot = await getAdminDb().collection('complaints').get();
    } else {
      snapshot = await getAdminDb().collection('complaints').where('clinicId', '==', auth.uid).get();
    }
    const complaints = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Complaint))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ complaints });
  } catch (err) {
    console.error('[complaints GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, ComplaintPayloadSchema);
    if (body instanceof NextResponse) return body;
    const clinicId = auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid;
    const data = compactObject({
      ...body,
      clinicId,
      status: 'open',
      createdAt: new Date().toISOString(),
    }) as Omit<Complaint, 'id'>;

    const ref = await getAdminDb().collection('complaints').add(data);
    await writeAuditLog(auth, 'complaint_created', 'complaint', ref.id, data.subject);
    if (data.priority === 'high') {
      await notifyAdmins({
        type: 'new_request',
        title: 'Yuqori muhimlikdagi shikoyat',
        body: data.subject,
        link: '/dashboard/complaints',
      });
    }
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[complaints POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, UpdateComplaintSchema);
    if (body instanceof NextResponse) return body;
    const ref = getAdminDb().collection('complaints').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as Complaint;
    if (!canAccess(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates = compactObject({
      status: body.status,
      resolution: body.resolution,
      resolvedAt: body.status === 'resolved' ? new Date().toISOString() : undefined,
    });
    await ref.update(updates);
    const merged = { ...existing, ...updates, id: body.id } as Complaint;
    await writeAuditLog(auth, `complaint_${body.status}`, 'complaint', body.id, existing.subject);
    return NextResponse.json(merged);
  } catch (err) {
    console.error('[complaints PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
