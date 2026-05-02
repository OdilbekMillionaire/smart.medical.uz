import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { compactObject, createServerNotification, writeAuditLog } from '@/lib/server-events';
import { z } from 'zod';
import type { ComplianceItem } from '@/types';

const ComplianceTypeSchema = z.enum(['license', 'certification', 'contract', 'protocol']);
const ComplianceStatusSchema = z.enum(['upcoming', 'overdue', 'done', 'kritik']);

const CreateComplianceSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  type: ComplianceTypeSchema,
  title: z.string().trim().min(1).max(250),
  dueDate: z.string().trim().min(1).max(40),
  reminderSent: z.boolean().optional(),
  autoDraftDocId: z.string().trim().max(128).optional(),
});

const UpdateComplianceSchema = z.object({
  id: z.string().trim().min(1).max(128),
  type: ComplianceTypeSchema.optional(),
  title: z.string().trim().min(1).max(250).optional(),
  dueDate: z.string().trim().min(1).max(40).optional(),
  status: ComplianceStatusSchema.optional(),
  reminderSent: z.boolean().optional(),
  autoDraftDocId: z.string().trim().max(128).optional(),
});

const DeleteComplianceSchema = z.object({
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
      snapshot = await db.collection('compliance').orderBy('dueDate', 'asc').get();
    } else {
      snapshot = await db
        .collection('compliance')
        .where('clinicId', '==', auth.uid)
        .get();
    }

    const items = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as ComplianceItem))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return NextResponse.json({ items });
  } catch (err: unknown) {
    console.error('[compliance GET error]', err);
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

    const body = await parseJson(req, CreateComplianceSchema);
    if (body instanceof NextResponse) return body;
    const clinicId = auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid;
    const data = compactObject({
      type: body.type,
      title: body.title,
      dueDate: body.dueDate,
      clinicId,
      reminderSent: false,
      status: computeStatus(body.dueDate),
      ...(body.autoDraftDocId ? { autoDraftDocId: body.autoDraftDocId } : {}),
    }) as Omit<ComplianceItem, 'id'>;

    const ref = await db.collection('compliance').add(data);
    await writeAuditLog(auth, 'compliance_created', 'compliance', ref.id, body.title);
    if (data.status === 'overdue' || data.status === 'kritik') {
      await createServerNotification({
        userId: clinicId,
        type: 'compliance_due',
        title: 'Muddat nazorati talab qilinadi',
        body: body.title,
        link: '/dashboard/compliance',
      });
    }
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err: unknown) {
    console.error('[compliance POST error]', err);
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

    const body = await parseJson(req, UpdateComplianceSchema);
    if (body instanceof NextResponse) return body;
    const { id, ...updates } = body;
    const snap = await db.collection('compliance').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = snap.data() as ComplianceItem;
    if (auth.role !== 'admin' && existing.clinicId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const cleanUpdates = compactObject(updates as Record<string, unknown>);
    await db.collection('compliance').doc(id).update(cleanUpdates);
    const merged = { ...existing, ...cleanUpdates, id } as ComplianceItem;
    await writeAuditLog(
      auth,
      updates.status ? `compliance_${updates.status}` : 'compliance_updated',
      'compliance',
      id,
      merged.title
    );
    if (updates.status && ['overdue', 'kritik'].includes(updates.status)) {
      await createServerNotification({
        userId: existing.clinicId,
        type: 'compliance_due',
        title: 'Muddat nazorati talab qilinadi',
        body: merged.title,
        link: '/dashboard/compliance',
      });
    }
    return NextResponse.json(merged);
  } catch (err: unknown) {
    console.error('[compliance PATCH error]', err);
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

    const body = await parseJson(req, DeleteComplianceSchema);
    if (body instanceof NextResponse) return body;
    const { id } = body;
    const snap = await db.collection('compliance').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = snap.data() as ComplianceItem;
    if (auth.role !== 'admin' && existing.clinicId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await db.collection('compliance').doc(id).delete();
    await writeAuditLog(auth, 'compliance_deleted', 'compliance', id, existing.title);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[compliance DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function computeStatus(dueDate: string): ComplianceItem['status'] {
  const due = new Date(dueDate);
  const now = new Date();
  if (due < now) return 'overdue';
  return 'upcoming';
}
