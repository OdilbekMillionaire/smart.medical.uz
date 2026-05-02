import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, createServerNotification, writeAuditLog } from '@/lib/server-events';
import type { InventoryItem } from '@/types';

const InventoryPayloadSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  name: z.string().trim().min(1).max(200),
  category: z.enum(['medicine', 'equipment', 'consumable', 'reagent']),
  unit: z.string().trim().min(1).max(50),
  quantity: z.number().nonnegative(),
  minQuantity: z.number().nonnegative(),
  expiryDate: z.string().trim().max(40).optional(),
  supplier: z.string().trim().max(200).optional(),
  price: z.number().nonnegative().optional(),
});

const UpdateInventorySchema = InventoryPayloadSchema.partial().extend({
  id: z.string().trim().min(1).max(128),
});

const DeleteSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

function canAccess(auth: { uid: string; role: string }, item: InventoryItem) {
  return auth.role === 'admin' || item.clinicId === auth.uid;
}

async function notifyIfRisky(item: InventoryItem) {
  if (item.quantity <= item.minQuantity) {
    await createServerNotification({
      userId: item.clinicId,
      type: 'compliance_due',
      title: 'Inventar miqdori kam',
      body: item.name,
      link: '/dashboard/inventory',
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
      snapshot = await db.collection('inventory').orderBy('name', 'asc').get();
    } else {
      snapshot = await db
        .collection('inventory')
        .where('clinicId', '==', auth.role === 'admin' && clinicId ? clinicId : auth.uid)
        .get();
    }
    const items = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as InventoryItem))
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[inventory GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, InventoryPayloadSchema);
    if (body instanceof NextResponse) return body;
    const now = new Date().toISOString();
    const clinicId = auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid;
    const data = compactObject({
      ...body,
      clinicId,
      createdAt: now,
      updatedAt: now,
    }) as Omit<InventoryItem, 'id'>;
    const ref = await getAdminDb().collection('inventory').add(data);
    const created = { id: ref.id, ...data };
    await writeAuditLog(auth, 'inventory_created', 'inventory', ref.id, data.name);
    await notifyIfRisky(created);
    return NextResponse.json(created);
  } catch (err) {
    console.error('[inventory POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, UpdateInventorySchema);
    if (body instanceof NextResponse) return body;
    const { id, ...updates } = body;
    const ref = getAdminDb().collection('inventory').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as InventoryItem;
    if (!canAccess(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const cleanUpdates = compactObject({ ...updates, updatedAt: new Date().toISOString() });
    await ref.update(cleanUpdates);
    const merged = { ...existing, ...cleanUpdates, id } as InventoryItem;
    await writeAuditLog(auth, 'inventory_updated', 'inventory', id, merged.name);
    await notifyIfRisky(merged);
    return NextResponse.json(merged);
  } catch (err) {
    console.error('[inventory PATCH error]', err);
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
    const ref = getAdminDb().collection('inventory').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as InventoryItem;
    if (!canAccess(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await ref.delete();
    await writeAuditLog(auth, 'inventory_deleted', 'inventory', body.id, existing.name);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[inventory DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
