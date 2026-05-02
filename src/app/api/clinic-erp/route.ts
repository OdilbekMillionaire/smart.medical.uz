import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { writeAuditLog } from '@/lib/server-events';
import { z } from 'zod';
import type { ERPRecord } from '@/types';

const ERPRecordSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  patientId: z.string().trim().min(1).max(128),
  visitDate: z.string().trim().min(1).max(40),
  diagnosis: z.string().trim().min(1).max(20000),
  prescriptions: z.array(z.string().max(5000)).max(100).default([]),
  procedures: z.array(z.string().max(5000)).max(100).default([]),
  nextVisit: z.string().trim().max(40).optional(),
  assignedDoctorId: z.string().trim().min(1).max(128),
  cleaningLogs: z.array(z.object({
    task: z.string().max(500),
    completedAt: z.string().max(40),
    completedBy: z.string().max(128),
  })).max(200).optional(),
});

const UpdateERPRecordSchema = ERPRecordSchema.partial().extend({
  id: z.string().trim().min(1).max(128),
});

const DeleteERPRecordSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;
    const db = getAdminDb();

    let snapshot;
    if (auth.role === 'admin') {
      snapshot = await db.collection('erp_records').orderBy('visitDate', 'desc').get();
    } else {
      snapshot = await db
        .collection('erp_records')
        .where('clinicId', '==', auth.uid)
        .get();
    }

    const records = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as ERPRecord))
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
    return NextResponse.json({ records });
  } catch (err: unknown) {
    console.error('[erp GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;
    const db = getAdminDb();

    const body = await parseJson(req, ERPRecordSchema);
    if (body instanceof NextResponse) return body;
    const data: Omit<ERPRecord, 'id'> = {
      ...body,
      clinicId: auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid,
      cleaningLogs: body.cleaningLogs ?? [],
    };

    const ref = await db.collection('erp_records').add(data);
    await writeAuditLog(auth, 'erp_record_created', 'erp_record', ref.id, data.patientId);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err: unknown) {
    console.error('[erp POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;
    const db = getAdminDb();

    const body = await parseJson(req, UpdateERPRecordSchema);
    if (body instanceof NextResponse) return body;
    const { id, ...updates } = body;
    const snap = await db.collection('erp_records').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = snap.data() as ERPRecord;
    if (auth.role !== 'admin' && existing.clinicId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (auth.role !== 'admin') delete (updates as Record<string, unknown>).clinicId;
    await db.collection('erp_records').doc(id).update(updates as Record<string, unknown>);
    await writeAuditLog(auth, 'erp_record_updated', 'erp_record', id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[erp PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;
    const db = getAdminDb();

    const body = await parseJson(req, DeleteERPRecordSchema);
    if (body instanceof NextResponse) return body;
    const { id } = body;
    const snap = await db.collection('erp_records').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = snap.data() as ERPRecord;
    if (auth.role !== 'admin' && existing.clinicId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await db.collection('erp_records').doc(id).delete();
    await writeAuditLog(auth, 'erp_record_deleted', 'erp_record', id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[erp DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
