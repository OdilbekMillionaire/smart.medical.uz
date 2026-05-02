import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, notifyAdmins, writeAuditLog } from '@/lib/server-events';
import type { Referral } from '@/types';

const ReferralPayloadSchema = z.object({
  fromClinicId: z.string().trim().min(1).max(128).optional(),
  fromClinicName: z.string().trim().min(1).max(200),
  toClinicName: z.string().trim().min(1).max(200),
  patientName: z.string().trim().min(1).max(200),
  patientDob: z.string().trim().max(40).optional(),
  diagnosis: z.string().trim().min(1).max(1000),
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  doctorName: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(5000).optional(),
});

const UpdateReferralSchema = z.object({
  id: z.string().trim().min(1).max(128),
  status: z.enum(['sent', 'received', 'completed']),
});

function canAccess(auth: { uid: string; role: string }, item: Referral) {
  return auth.role === 'admin' || item.fromClinicId === auth.uid;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic', 'doctor']);
    if (roleError) return roleError;

    let snapshot;
    if (auth.role === 'admin') {
      snapshot = await getAdminDb().collection('referrals').orderBy('createdAt', 'desc').get();
    } else {
      snapshot = await getAdminDb()
        .collection('referrals')
        .where('fromClinicId', '==', auth.uid)
        .get();
    }
    const referrals = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Referral))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ referrals });
  } catch (err) {
    console.error('[referrals GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic', 'doctor']);
    if (roleError) return roleError;

    const body = await parseJson(req, ReferralPayloadSchema);
    if (body instanceof NextResponse) return body;
    const fromClinicId = auth.role === 'admin' && body.fromClinicId ? body.fromClinicId : auth.uid;
    const data = compactObject({
      ...body,
      fromClinicId,
      status: 'sent',
      createdAt: new Date().toISOString(),
    }) as Omit<Referral, 'id'>;

    const ref = await getAdminDb().collection('referrals').add(data);
    await writeAuditLog(auth, 'referral_created', 'referral', ref.id, data.patientName);
    if (data.urgency === 'emergency') {
      await notifyAdmins({
        type: 'new_request',
        title: 'Shoshilinch yo\'llanma',
        body: `${data.patientName} - ${data.toClinicName}`,
        link: '/dashboard/referrals',
      });
    }
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[referrals POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic', 'doctor']);
    if (roleError) return roleError;

    const body = await parseJson(req, UpdateReferralSchema);
    if (body instanceof NextResponse) return body;
    const ref = getAdminDb().collection('referrals').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as Referral;
    if (!canAccess(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await ref.update({ status: body.status });
    const merged = { ...existing, status: body.status, id: body.id } as Referral;
    await writeAuditLog(auth, `referral_${body.status}`, 'referral', body.id, existing.patientName);
    return NextResponse.json(merged);
  } catch (err) {
    console.error('[referrals PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
