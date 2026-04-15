import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import type { ERPRecord, UserRole } from '@/types';

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
      snapshot = await db.collection('erp_records').orderBy('visitDate', 'desc').get();
    } else {
      snapshot = await db
        .collection('erp_records')
        .where('clinicId', '==', decoded.uid)
        .orderBy('visitDate', 'desc')
        .get();
    }

    const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ERPRecord));
    return NextResponse.json({ records });
  } catch (err: unknown) {
    console.error('[erp GET error]', err);
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

    const body = await req.json() as Omit<ERPRecord, 'id' | 'clinicId'>;
    const data: Omit<ERPRecord, 'id'> = {
      ...body,
      clinicId: decoded.uid,
      cleaningLogs: body.cleaningLogs ?? [],
    };

    const ref = await db.collection('erp_records').add(data);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err: unknown) {
    console.error('[erp POST error]', err);
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

    const body = await req.json() as { id: string } & Partial<ERPRecord>;
    const { id, ...updates } = body;
    await db.collection('erp_records').doc(id).update(updates as Record<string, unknown>);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[erp PATCH error]', err);
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
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = decoded.role as UserRole;
    const db = getAdminDb();

    const { id } = await req.json() as { id: string };
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await db.collection('erp_records').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[erp DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
