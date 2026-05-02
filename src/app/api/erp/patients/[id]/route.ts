import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { z } from 'zod';
import type { ERPRecord } from '@/types';

export const runtime = 'nodejs';

const UpdatePatientSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  dob: z.string().trim().max(20).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(req);
  if (isApiError(auth)) return auth;
  const roleErr = requireRole(auth, ['clinic', 'admin']);
  if (roleErr) return roleErr;

  const db = getAdminDb();
  const { id } = await params;

  try {
    const snap = await db.collection('erp_patients').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const patient = { id: snap.id, ...snap.data() } as { clinicId: string; id: string };
    if (auth.role !== 'admin' && patient.clinicId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const visitSnap = await db
      .collection('erp_records')
      .where('clinicId', '==', patient.clinicId)
      .where('patientId', '==', id)
      .get();

    const visits = visitSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as ERPRecord))
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate));

    return NextResponse.json({ patient, visits });
  } catch (err) {
    console.error('[erp/patients/[id] GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(req);
  if (isApiError(auth)) return auth;
  const roleErr = requireRole(auth, ['clinic', 'admin']);
  if (roleErr) return roleErr;

  const db = getAdminDb();
  const { id } = await params;

  const snap = await db.collection('erp_patients').doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const existing = snap.data() as { clinicId: string };
  if (auth.role !== 'admin' && existing.clinicId !== auth.uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await parseJson(req, UpdatePatientSchema);
  if (body instanceof NextResponse) return body;

  try {
    await db.collection('erp_patients').doc(id).update({
      ...body,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[erp/patients/[id] PUT]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
