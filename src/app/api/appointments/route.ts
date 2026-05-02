import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, createServerNotification, writeAuditLog } from '@/lib/server-events';
import type { Appointment } from '@/types';

const AppointmentPayloadSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  clinicName: z.string().trim().min(1).max(200).optional(),
  patientId: z.string().trim().min(1).max(128).optional(),
  patientName: z.string().trim().min(1).max(200),
  patientPhone: z.string().trim().max(80).optional(),
  doctorId: z.string().trim().max(128).optional(),
  doctorName: z.string().trim().max(200).optional(),
  date: z.string().trim().min(1).max(40),
  time: z.string().trim().min(1).max(20),
  reason: z.string().trim().min(1).max(1000),
  notes: z.string().trim().max(2000).optional(),
});

const UpdateAppointmentSchema = z.object({
  id: z.string().trim().min(1).max(128),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'done']).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const DeleteSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

function canManage(auth: { uid: string; role: string }, item: Appointment) {
  return auth.role === 'admin' || item.clinicId === auth.uid;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const db = getAdminDb();

    let snapshot;
    if (auth.role === 'admin') {
      snapshot = await db.collection('appointments').orderBy('date', 'desc').get();
    } else if (auth.role === 'clinic') {
      snapshot = await db
        .collection('appointments')
        .where('clinicId', '==', auth.uid)
        .get();
    } else {
      snapshot = await db
        .collection('appointments')
        .where('patientId', '==', auth.uid)
        .get();
    }

    const appointments = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Appointment))
      .sort((a, b) => b.date.localeCompare(a.date));
    return NextResponse.json({ appointments });
  } catch (err) {
    console.error('[appointments GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    if (!['admin', 'clinic'].includes(auth.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await parseJson(req, AppointmentPayloadSchema);
    if (body instanceof NextResponse) return body;
    const now = new Date().toISOString();
    const clinicId = auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid;
    const data = compactObject({
      ...body,
      clinicId,
      clinicName: body.clinicName ?? 'Klinika',
      patientId: body.patientId ?? `manual_${Date.now()}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }) as Omit<Appointment, 'id'>;

    const ref = await getAdminDb().collection('appointments').add(data);
    await writeAuditLog(auth, 'appointment_created', 'appointment', ref.id, `${data.patientName} ${data.date} ${data.time}`);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[appointments POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const body = await parseJson(req, UpdateAppointmentSchema);
    if (body instanceof NextResponse) return body;

    const ref = getAdminDb().collection('appointments').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as Appointment;
    if (!canManage(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates = compactObject({
      status: body.status,
      notes: body.notes,
      updatedAt: new Date().toISOString(),
    });
    await ref.update(updates);
    const merged = { ...existing, ...updates, id: body.id } as Appointment;
    await writeAuditLog(auth, body.status ? `appointment_${body.status}` : 'appointment_updated', 'appointment', body.id, existing.patientName);
    if (body.status && existing.patientId && !existing.patientId.startsWith('manual_')) {
      await createServerNotification({
        userId: existing.patientId,
        type: 'request_replied',
        title: 'Qabul holati yangilandi',
        body: `${existing.date} ${existing.time}`,
        link: '/dashboard/appointments',
      });
    }
    return NextResponse.json(merged);
  } catch (err) {
    console.error('[appointments PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const body = await parseJson(req, DeleteSchema);
    if (body instanceof NextResponse) return body;

    const ref = getAdminDb().collection('appointments').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as Appointment;
    if (!canManage(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await ref.delete();
    await writeAuditLog(auth, 'appointment_deleted', 'appointment', body.id, existing.patientName);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[appointments DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
