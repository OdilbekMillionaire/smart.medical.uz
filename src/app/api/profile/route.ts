import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { compactObject, writeAuditLog } from '@/lib/server-events';
import type { UserRole } from '@/types';

const USER_ROLES: UserRole[] = ['admin', 'clinic', 'doctor', 'patient'];

const BootstrapProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(200),
  role: z.enum(['clinic', 'doctor', 'patient']),
});

const ProfilePatchSchema = z.record(z.string(), z.unknown()).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

const BLOCKED_FIELDS = new Set(['uid', 'email', 'role', 'createdAt', 'profileComplete']);
const COMMON_ALLOWED_FIELDS = new Set([
  'displayName',
  'photoURL',
  'phone',
  'documents',
  'updatedAt',
]);
const ROLE_ALLOWED_FIELDS: Record<UserRole, Set<string>> = {
  admin: new Set(['displayName', 'photoURL', 'phone', 'updatedAt']),
  clinic: new Set([
    'clinicName',
    'contactPerson',
    'address',
    'description',
    'departments',
    'documents',
    'lat',
    'lng',
    'locationPinned',
  ]),
  doctor: new Set([
    'fullName',
    'specialization',
    'institution',
    'consultFee',
    'bio',
    'services',
    'documents',
  ]),
  patient: new Set([
    'fullName',
    'dob',
    'bloodType',
    'height',
    'weight',
    'allergies',
    'conditions',
  ]),
};

function sanitizeProfilePatch(role: UserRole, raw: Record<string, unknown>) {
  const allowed = new Set([...Array.from(COMMON_ALLOWED_FIELDS), ...Array.from(ROLE_ALLOWED_FIELDS[role])]);
  return compactObject(Object.fromEntries(
    Object.entries(raw).filter(([key, value]) => !BLOCKED_FIELDS.has(key) && allowed.has(key) && value !== undefined)
  ));
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const body = await parseJson(req, BootstrapProfileSchema);
    if (body instanceof NextResponse) return body;

    const db = getAdminDb();
    const userRef = db.collection('users').doc(decoded.uid);
    const existing = await userRef.get();
    if (existing.exists) {
      const existingRole = existing.data()?.role;
      if (USER_ROLES.includes(existingRole)) {
        return NextResponse.json({ success: true });
      }
    }

    const now = new Date().toISOString();
    await userRef.set({
      uid: decoded.uid,
      email: decoded.email ?? '',
      displayName: body.displayName,
      role: body.role,
      profileComplete: false,
      createdAt: now,
      updatedAt: now,
    }, { merge: false });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[profile POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, ProfilePatchSchema);
    if (body instanceof NextResponse) return body;

    const updates = sanitizeProfilePatch(auth.role, body as Record<string, unknown>);
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No allowed fields to update' }, { status: 400 });
    }

    const now = new Date().toISOString();
    updates.updatedAt = now;
    await getAdminDb().collection('users').doc(auth.uid).set(updates, { merge: true });
    await writeAuditLog(auth, 'profile_updated', 'user', auth.uid);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[profile PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
