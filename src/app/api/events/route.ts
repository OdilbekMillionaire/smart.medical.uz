import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, createServerNotification, writeAuditLog } from '@/lib/server-events';
import type { ClinicEvent } from '@/types';

const EventPayloadSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  title: z.string().trim().min(1).max(250),
  description: z.string().trim().max(5000).optional(),
  type: z.enum(['training', 'conference', 'inspection', 'meeting', 'other']),
  date: z.string().trim().min(1).max(40),
  endDate: z.string().trim().max(40).optional(),
  location: z.string().trim().max(250).optional(),
  organizer: z.string().trim().max(250).optional(),
  attendees: z.array(z.string().trim().max(128)).optional(),
});

const DeleteSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

function canAccess(auth: { uid: string; role: string }, item: ClinicEvent) {
  return auth.role === 'admin' || item.clinicId === auth.uid;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    let snapshot;
    if (auth.role === 'admin') {
      snapshot = await getAdminDb().collection('clinic_events').get();
    } else {
      snapshot = await getAdminDb().collection('clinic_events').where('clinicId', '==', auth.uid).get();
    }
    const events = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as ClinicEvent))
      .sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json({ events });
  } catch (err) {
    console.error('[events GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, EventPayloadSchema);
    if (body instanceof NextResponse) return body;
    const clinicId = auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid;
    const data = compactObject({
      ...body,
      clinicId,
      createdAt: new Date().toISOString(),
    }) as Omit<ClinicEvent, 'id'>;
    const ref = await getAdminDb().collection('clinic_events').add(data);
    await writeAuditLog(auth, 'event_created', 'clinic_event', ref.id, data.title);
    if (data.type === 'inspection') {
      await createServerNotification({
        userId: clinicId,
        type: 'compliance_due',
        title: 'Tekshiruv tadbiri rejalashtirildi',
        body: data.title,
        link: '/dashboard/calendar',
      });
    }
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[events POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, DeleteSchema);
    if (body instanceof NextResponse) return body;
    const ref = getAdminDb().collection('clinic_events').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as ClinicEvent;
    if (!canAccess(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await ref.delete();
    await writeAuditLog(auth, 'event_deleted', 'clinic_event', body.id, existing.title);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[events DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
