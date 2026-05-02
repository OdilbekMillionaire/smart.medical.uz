import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { z } from 'zod';

const ReviewSchema = z.object({
  docId: z.string().trim().min(1).max(128),
  action: z.enum(['approve', 'reject']),
  note: z.string().trim().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await parseJson(req, ReviewSchema);
    if (body instanceof NextResponse) return body;

    const db = getAdminDb();
    const docRef = db.collection('documents').doc(body.docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const newStatus = body.action === 'approve' ? 'approved' : 'rejected';

    await docRef.update({
      status: newStatus,
      reviewedBy: auth.uid,
      reviewNote: body.note ?? '',
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: unknown) {
    console.error('[documents/review POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
