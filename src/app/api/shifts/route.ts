import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, writeAuditLog } from '@/lib/server-events';
import type { Shift } from '@/types';

const ShiftPayloadSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  staffId: z.string().trim().max(128).optional(),
  staffName: z.string().trim().min(1).max(200),
  date: z.string().trim().min(1).max(40),
  startTime: z.string().trim().min(1).max(20),
  endTime: z.string().trim().min(1).max(20),
  role: z.string().trim().min(1).max(100),
  notes: z.string().trim().max(2000).optional(),
});

const DeleteSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

function canAccess(auth: { uid: string; role: string }, item: Shift) {
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
      snapshot = await getAdminDb().collection('shifts').get();
    } else {
      snapshot = await getAdminDb().collection('shifts').where('clinicId', '==', auth.uid).get();
    }
    const shifts = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Shift))
      .sort((a, b) => (a.date + a.startTime) > (b.date + b.startTime) ? -1 : 1);
    return NextResponse.json({ shifts });
  } catch (err) {
    console.error('[shifts GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, ShiftPayloadSchema);
    if (body instanceof NextResponse) return body;
    const clinicId = auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid;
    const data = compactObject({
      ...body,
      clinicId,
      staffId: body.staffId || `${clinicId}_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }) as Omit<Shift, 'id'>;
    const ref = await getAdminDb().collection('shifts').add(data);
    await writeAuditLog(auth, 'shift_created', 'shift', ref.id, `${data.staffName} ${data.date}`);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[shifts POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, DeleteSchema);
    if (body instanceof NextResponse) return body;
    const ref = getAdminDb().collection('shifts').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as Shift;
    if (!canAccess(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await ref.delete();
    await writeAuditLog(auth, 'shift_deleted', 'shift', body.id, `${existing.staffName} ${existing.date}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[shifts DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
