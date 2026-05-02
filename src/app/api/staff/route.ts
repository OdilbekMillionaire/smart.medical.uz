import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, writeAuditLog } from '@/lib/server-events';
import type { StaffMember } from '@/types';

const StaffStatusSchema = z.enum(['active', 'leave', 'dismissed']);

const StaffPayloadSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  fullName: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(100),
  specialization: z.string().trim().max(200).optional(),
  phone: z.string().trim().min(1).max(80),
  email: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().trim().email().max(200).optional()
  ),
  hireDate: z.string().trim().max(40).optional(),
  salary: z.number().nonnegative().optional(),
  status: StaffStatusSchema,
});

const UpdateStaffSchema = StaffPayloadSchema.partial().extend({
  id: z.string().trim().min(1).max(128),
});

const DeleteSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

function canAccess(auth: { uid: string; role: string }, item: StaffMember) {
  return auth.role === 'admin' || item.clinicId === auth.uid;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const db = getAdminDb();
    const clinicId = req.nextUrl.searchParams.get('clinicId');
    let snapshot;
    if (auth.role === 'admin' && !clinicId) {
      snapshot = await db.collection('staff').orderBy('fullName', 'asc').get();
    } else {
      snapshot = await db
        .collection('staff')
        .where('clinicId', '==', auth.role === 'admin' && clinicId ? clinicId : auth.uid)
        .get();
    }
    const staff = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as StaffMember))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
    return NextResponse.json({ staff });
  } catch (err) {
    console.error('[staff GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, StaffPayloadSchema);
    if (body instanceof NextResponse) return body;

    const clinicId = auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid;
    const data = compactObject({
      ...body,
      clinicId,
      createdAt: new Date().toISOString(),
    }) as Omit<StaffMember, 'id'>;

    const ref = await getAdminDb().collection('staff').add(data);
    await writeAuditLog(auth, 'staff_created', 'staff', ref.id, data.fullName);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[staff POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, UpdateStaffSchema);
    if (body instanceof NextResponse) return body;
    const { id, ...updates } = body;
    const ref = getAdminDb().collection('staff').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as StaffMember;
    if (!canAccess(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const cleanUpdates = compactObject(updates as Record<string, unknown>);
    await ref.update(cleanUpdates);
    const merged = { ...existing, ...cleanUpdates, id } as StaffMember;
    await writeAuditLog(auth, 'staff_updated', 'staff', id, merged.fullName);
    return NextResponse.json(merged);
  } catch (err) {
    console.error('[staff PATCH error]', err);
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
    const ref = getAdminDb().collection('staff').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as StaffMember;
    if (!canAccess(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await ref.delete();
    await writeAuditLog(auth, 'staff_deleted', 'staff', body.id, existing.fullName);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[staff DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
