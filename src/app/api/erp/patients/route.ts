import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { z } from 'zod';

export const runtime = 'nodejs';

const PatientSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(30),
  dob: z.string().trim().max(20).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  notes: z.string().trim().max(1000).optional(),
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

  const search = req.nextUrl.searchParams.get('search')?.toLowerCase() ?? '';

  try {
    const snap = await db
      .collection('erp_patients')
      .where('clinicId', '==', clinicId)
      .orderBy('name')
      .get();

    type PatientDoc = { id: string; name: string; phone: string; clinicId: string; dob?: string; gender?: string };
    let patients = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PatientDoc));

    if (search) {
      patients = patients.filter(
        (p) => p.name.toLowerCase().includes(search) || p.phone.includes(search)
      );
    }

    // Attach last visit date and count from erp_records
    const visitSnap = await db
      .collection('erp_records')
      .where('clinicId', '==', clinicId)
      .get();

    const visitMap: Record<string, { count: number; lastVisit: string }> = {};
    for (const doc of visitSnap.docs) {
      const d = doc.data() as { patientId: string; visitDate: string };
      if (!visitMap[d.patientId]) visitMap[d.patientId] = { count: 0, lastVisit: '' };
      visitMap[d.patientId].count += 1;
      if (d.visitDate > visitMap[d.patientId].lastVisit) {
        visitMap[d.patientId].lastVisit = d.visitDate;
      }
    }

    const enriched = patients.map((p) => ({
      ...p,
      visitCount: visitMap[p.id]?.count ?? 0,
      lastVisit: visitMap[p.id]?.lastVisit ?? null,
    }));

    return NextResponse.json({ patients: enriched });
  } catch (err) {
    console.error('[erp/patients GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiError(auth)) return auth;
  const roleErr = requireRole(auth, ['clinic', 'admin']);
  if (roleErr) return roleErr;

  const body = await parseJson(req, PatientSchema);
  if (body instanceof NextResponse) return body;

  const db = getAdminDb();
  const clinicId = auth.uid;

  try {
    const data = {
      ...body,
      clinicId,
      createdAt: new Date().toISOString(),
    };
    const ref = await db.collection('erp_patients').add(data);
    return NextResponse.json({ id: ref.id, ...data }, { status: 201 });
  } catch (err) {
    console.error('[erp/patients POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
