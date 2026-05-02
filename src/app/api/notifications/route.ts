import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';

const MarkReadSchema = z.object({
  id: z.string().trim().min(1).max(128).optional(),
  all: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, MarkReadSchema);
    if (body instanceof NextResponse) return body;
    if (!body.id && !body.all) {
      return NextResponse.json({ error: 'id or all is required' }, { status: 400 });
    }

    const db = getAdminDb();
    if (body.all) {
      const snapshot = await db
        .collection('notifications')
        .where('userId', '==', auth.uid)
        .where('read', '==', false)
        .get();
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
        await batch.commit();
      }
      return NextResponse.json({ success: true });
    }

    const ref = db.collection('notifications').doc(body.id as string);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const notification = snap.data();
    if (auth.role !== 'admin' && notification?.userId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ref.update({ read: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[notifications PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
