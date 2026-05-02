import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { z } from 'zod';

export const runtime = 'nodejs';

const CleaningLogSchema = z.object({
  task: z.string().trim().min(1).max(200),
  completedBy: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(500).optional(),
  date: z.string().trim().max(20).optional(), // YYYY-MM-DD, defaults to today
});

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiError(auth)) return auth;
  const roleErr = requireRole(auth, ['clinic', 'admin']);
  if (roleErr) return roleErr;

  const db = getAdminDb();
  const clinicId = auth.role === 'admin'
    ? (req.nextUrl.searchParams.get('clinicId') ?? auth.uid)
    : auth.uid;

  const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

  try {
    const snap = await db
      .collection('erp_cleaning')
      .where('clinicId', '==', clinicId)
      .where('date', '==', date)
      .get();

    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ logs });
  } catch (err) {
    console.error('[erp/cleaning GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiError(auth)) return auth;
  const roleErr = requireRole(auth, ['clinic', 'admin']);
  if (roleErr) return roleErr;

  const body = await parseJson(req, CleaningLogSchema);
  if (body instanceof NextResponse) return body;

  const db = getAdminDb();
  const date = body.date ?? new Date().toISOString().slice(0, 10);

  try {
    const data = {
      clinicId: auth.uid,
      task: body.task,
      completedBy: body.completedBy,
      notes: body.notes ?? '',
      date,
      completedAt: new Date().toISOString(),
    };
    const ref = await db.collection('erp_cleaning').add(data);
    return NextResponse.json({ id: ref.id, ...data }, { status: 201 });
  } catch (err) {
    console.error('[erp/cleaning POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
