import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson, requireAuthToken } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, writeAuditLog } from '@/lib/server-events';

const DocumentsSchema = z.record(z.string(), z.string().url().or(z.string().trim().min(1)));

const ClinicOnboardingSchema = z.object({
  role: z.literal('clinic'),
  clinicName: z.string().trim().min(2).max(250),
  licenseNumber: z.string().trim().min(3).max(120),
  licenseExpiry: z.string().trim().min(1).max(40),
  address: z.string().trim().min(5).max(1000),
  region: z.string().trim().min(1).max(120),
  district: z.string().trim().min(2).max(120),
  specialties: z.array(z.string().trim().min(1).max(120)).min(1).max(40),
  doctorCount: z.number().int().min(0).max(100000),
  nurseCount: z.number().int().min(0).max(100000),
  adminCount: z.number().int().min(0).max(100000),
  contactPerson: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(9).max(80),
  documents: DocumentsSchema,
});

const DoctorOnboardingSchema = z.object({
  role: z.literal('doctor'),
  fullName: z.string().trim().min(3).max(250),
  specialization: z.string().trim().min(1).max(160),
  category: z.enum(['first', 'second', 'highest']),
  diplomaNumber: z.string().trim().min(3).max(120),
  institution: z.string().trim().min(3).max(250),
  certExpiry: z.string().trim().min(1).max(40),
  linkedClinicId: z.string().trim().max(128).optional().nullable(),
  phone: z.string().trim().min(9).max(80),
  documents: DocumentsSchema,
});

const PatientOnboardingSchema = z.object({
  role: z.literal('patient'),
  fullName: z.string().trim().min(3).max(250),
  dob: z.string().trim().min(1).max(40),
  gender: z.string().trim().min(1).max(40),
  phone: z.string().trim().min(9).max(80),
  bloodType: z.string().trim().max(40).optional().nullable(),
  conditions: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
  allergies: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
});

const OnboardingSchema = z.discriminatedUnion('role', [
  ClinicOnboardingSchema,
  DoctorOnboardingSchema,
  PatientOnboardingSchema,
]);

function collectionForRole(role: 'clinic' | 'doctor' | 'patient') {
  if (role === 'clinic') return 'clinics';
  if (role === 'doctor') return 'doctors';
  return 'patients';
}

function displayNameFor(body: z.infer<typeof OnboardingSchema>) {
  if (body.role === 'clinic') return body.clinicName;
  return body.fullName;
}

export async function POST(req: NextRequest) {
  try {
    // requireAuthToken (not requireApiUser) — allows users mid-registration who
    // have a valid Firebase token but no Firestore role document yet
    const auth = await requireAuthToken(req);
    if (auth instanceof NextResponse) return auth;

    const body = await parseJson(req, OnboardingSchema);
    if (body instanceof NextResponse) return body;
    // If the user already has a role, it must match what they're submitting
    if (auth.role !== null && auth.role !== body.role) {
      return NextResponse.json({ error: 'Role mismatch' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const displayName = displayNameFor(body);
    const data = compactObject({
      ...body,
      uid: auth.uid,
      email: auth.email ?? '',
      displayName,
      profileComplete: true,
      createdAt: now,
      updatedAt: now,
    });

    const db = getAdminDb();
    const batch = db.batch();
    batch.set(db.collection(collectionForRole(body.role)).doc(auth.uid), data, { merge: true });
    batch.set(db.collection('users').doc(auth.uid), data, { merge: true });
    await batch.commit();

    await writeAuditLog({ ...auth, role: body.role }, 'onboarding_completed', body.role, auth.uid);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[onboarding POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
