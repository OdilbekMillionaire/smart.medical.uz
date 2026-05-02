import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, writeAuditLog } from '@/lib/server-events';
import type { BaseUser, VaccinationRecord } from '@/types';

const CreateVaccinationSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  patientName: z.string().trim().max(200).optional(),
  vaccineName: z.string().trim().min(1).max(200),
  doseNumber: z.number().int().min(1).max(20),
  dateGiven: z.string().trim().min(1).max(40),
  nextDoseDate: z.string().trim().max(40).optional(),
  batchNumber: z.string().trim().max(120).optional(),
  administeredBy: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(10000).optional(),
});

function userLabel(user: (Partial<BaseUser> & { fullName?: string }) | undefined, fallback: string) {
  return user?.fullName || user?.displayName || user?.email || fallback;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const db = getAdminDb();
    let snapshot: FirebaseFirestore.QuerySnapshot;
    if (auth.role === 'admin') {
      snapshot = await db.collection('vaccinations').get();
    } else if (auth.role === 'clinic') {
      snapshot = await db.collection('vaccinations').where('clinicId', '==', auth.uid).get();
    } else {
      snapshot = await db.collection('vaccinations').where('patientId', '==', auth.uid).get();
    }

    const records = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as VaccinationRecord))
      .sort((a, b) => b.dateGiven.localeCompare(a.dateGiven));

    return NextResponse.json({ records });
  } catch (err) {
    console.error('[vaccinations GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, CreateVaccinationSchema);
    if (body instanceof NextResponse) return body;

    const db = getAdminDb();
    const userSnap = await db.collection('users').doc(auth.uid).get();
    const userData = userSnap.data() as (Partial<BaseUser> & { linkedClinicId?: string; fullName?: string }) | undefined;
    const isClinicEntry = auth.role === 'clinic' || auth.role === 'admin';
    const clinicId = isClinicEntry
      ? (auth.role === 'admin' ? body.clinicId ?? auth.uid : auth.uid)
      : body.clinicId ?? userData?.linkedClinicId ?? auth.uid;
    const patientId = isClinicEntry ? `manual_${Date.now()}` : auth.uid;
    const patientName = isClinicEntry
      ? body.patientName?.trim() || 'Manual patient'
      : userLabel(userData, auth.email ?? 'Patient');

    const data = compactObject({
      patientId,
      clinicId,
      patientName,
      vaccineName: body.vaccineName,
      doseNumber: body.doseNumber,
      dateGiven: body.dateGiven,
      nextDoseDate: body.nextDoseDate,
      batchNumber: body.batchNumber,
      administeredBy: body.administeredBy,
      notes: body.notes,
      createdAt: new Date().toISOString(),
    }) as Omit<VaccinationRecord, 'id'>;

    const ref = await db.collection('vaccinations').add(data);
    await writeAuditLog(auth, 'vaccination_created', 'vaccination', ref.id, data.vaccineName);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[vaccinations POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
