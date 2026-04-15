import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import type { Document, UserRole } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const snap = await db.collection('documents').doc(params.id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const doc = { id: snap.id, ...snap.data() } as Document;
    const role = decoded.role as UserRole;
    if (role !== 'admin' && doc.ownerId !== decoded.uid) {
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
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const snap = await db.collection('documents').doc(params.id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = snap.data() as Document;
    const role = decoded.role as UserRole;

    const body = await req.json() as Partial<Document>;

    // Only admin can approve/reject
    if ((body.status === 'approved' || body.status === 'rejected') && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Non-admin can only edit their own docs in draft state
    if (role !== 'admin' && existing.ownerId !== decoded.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = { ...body, updatedAt: new Date().toISOString() };
    await db.collection('documents').doc(params.id).update(updates);
    const merged = Object.assign({}, existing, updates, { id: params.id });
    return NextResponse.json(merged);
  } catch (err: unknown) {
    console.error('[document PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const snap = await db.collection('documents').doc(params.id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = snap.data() as Document;
    const role = decoded.role as UserRole;
    if (role !== 'admin' && existing.ownerId !== decoded.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await db.collection('documents').doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[document DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
