import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import type { ComplianceItem, UserRole } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = decoded.role as UserRole;
    const db = getAdminDb();

    let snapshot;
    if (role === 'admin') {
      snapshot = await db.collection('compliance').orderBy('dueDate', 'asc').get();
    } else {
      snapshot = await db
        .collection('compliance')
        .where('clinicId', '==', decoded.uid)
        .orderBy('dueDate', 'asc')
        .get();
    }

    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ComplianceItem));
    return NextResponse.json({ items });
  } catch (err: unknown) {
    console.error('[compliance GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();

    const body = await req.json() as Omit<ComplianceItem, 'id'>;
    const data: Omit<ComplianceItem, 'id'> = {
      ...body,
      clinicId: body.clinicId || decoded.uid,
      reminderSent: false,
      status: computeStatus(body.dueDate),
    };

    const ref = await db.collection('compliance').add(data);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err: unknown) {
    console.error('[compliance POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();

    const body = await req.json() as { id: string } & Partial<ComplianceItem>;
    const { id, ...updates } = body;
    await db.collection('compliance').doc(id).update(updates as Record<string, unknown>);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[compliance PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();

    const { id } = await req.json() as { id: string };
    await db.collection('compliance').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[compliance DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function computeStatus(dueDate: string): ComplianceItem['status'] {
  const due = new Date(dueDate);
  const now = new Date();
  if (due < now) return 'overdue';
  return 'upcoming';
}
