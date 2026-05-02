import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, createServerNotification, writeAuditLog } from '@/lib/server-events';
import type { Equipment } from '@/types';

const EquipmentPayloadSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  name: z.string().trim().min(1).max(200),
  model: z.string().trim().max(200),
  serialNumber: z.string().trim().max(200).optional(),
  purchaseDate: z.string().trim().max(40).optional(),
  warrantyExpiry: z.string().trim().max(40).optional(),
  lastService: z.string().trim().max(40).optional(),
  nextService: z.string().trim().max(40).optional(),
  status: z.enum(['operational', 'maintenance', 'broken', 'decommissioned']),
  location: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(2000).optional(),
});

const UpdateEquipmentSchema = EquipmentPayloadSchema.partial().extend({
  id: z.string().trim().min(1).max(128),
});

const DeleteSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

function canAccess(auth: { uid: string; role: string }, item: Equipment) {
  return auth.role === 'admin' || item.clinicId === auth.uid;
}

async function notifyIfRisky(item: Equipment) {
  if (item.status === 'broken' || item.status === 'maintenance') {
    await createServerNotification({
      userId: item.clinicId,
      type: 'compliance_due',
      title: "Jihoz holati e'tibor talab qiladi",
      body: item.name,
      link: '/dashboard/equipment',
    });
  }
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
      snapshot = await db.collection('equipment').orderBy('name', 'asc').get();
    } else {
      snapshot = await db
        .collection('equipment')
        .where('clinicId', '==', auth.role === 'admin' && clinicId ? clinicId : auth.uid)
        .get();
    }
    const equipment = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Equipment))
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ equipment });
  } catch (err) {
    console.error('[equipment GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, EquipmentPayloadSchema);
    if (body instanceof NextResponse) return body;
    const clinicId = auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid;
    const data = compactObject({
      ...body,
      clinicId,
      createdAt: new Date().toISOString(),
    }) as Omit<Equipment, 'id'>;
    const ref = await getAdminDb().collection('equipment').add(data);
    const created = { id: ref.id, ...data };
    await writeAuditLog(auth, 'equipment_created', 'equipment', ref.id, data.name);
    await notifyIfRisky(created);
    return NextResponse.json(created);
  } catch (err) {
    console.error('[equipment POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, UpdateEquipmentSchema);
    if (body instanceof NextResponse) return body;
    const { id, ...updates } = body;
    const ref = getAdminDb().collection('equipment').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as Equipment;
    if (!canAccess(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const cleanUpdates = compactObject(updates as Record<string, unknown>);
    await ref.update(cleanUpdates);
    const merged = { ...existing, ...cleanUpdates, id } as Equipment;
    await writeAuditLog(auth, 'equipment_updated', 'equipment', id, merged.name);
    await notifyIfRisky(merged);
    return NextResponse.json(merged);
  } catch (err) {
    console.error('[equipment PATCH error]', err);
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
    const ref = getAdminDb().collection('equipment').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as Equipment;
    if (!canAccess(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await ref.delete();
    await writeAuditLog(auth, 'equipment_deleted', 'equipment', body.id, existing.name);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[equipment DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
