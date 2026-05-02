import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, notifyAdmins, writeAuditLog } from '@/lib/server-events';
import type { Announcement } from '@/types';

const AnnouncementPayloadSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  title: z.string().trim().min(1).max(250),
  body: z.string().trim().min(1).max(20000),
  priority: z.enum(['normal', 'important', 'urgent']),
  pinned: z.boolean(),
  targetRole: z.string().trim().max(80).optional(),
  expiresAt: z.string().trim().max(40).optional(),
});

const DeleteSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

function canDelete(auth: { uid: string; role: string }, item: Announcement) {
  return auth.role === 'admin' || item.clinicId === auth.uid;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    let snapshot;
    if (auth.role === 'admin') {
      snapshot = await getAdminDb().collection('announcements').get();
    } else if (auth.role === 'clinic') {
      snapshot = await getAdminDb().collection('announcements').where('clinicId', '==', auth.uid).get();
    } else {
      snapshot = await getAdminDb().collection('announcements').get();
    }

    const now = new Date().toISOString();
    const announcements = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Announcement))
      .filter((item) => auth.role === 'admin' || !item.expiresAt || item.expiresAt > now)
      .filter((item) => auth.role === 'admin' || auth.role === 'clinic' || !item.targetRole || item.targetRole === 'all' || item.targetRole === auth.role)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ announcements });
  } catch (err) {
    console.error('[announcements GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, AnnouncementPayloadSchema);
    if (body instanceof NextResponse) return body;
    const clinicId = auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid;
    const data = compactObject({
      ...body,
      clinicId,
      authorId: auth.uid,
      authorName: auth.email ?? auth.role,
      createdAt: new Date().toISOString(),
    }) as Omit<Announcement, 'id'>;
    const ref = await getAdminDb().collection('announcements').add(data);
    await writeAuditLog(auth, 'announcement_created', 'announcement', ref.id, data.title);
    if (data.priority === 'urgent') {
      await notifyAdmins({
        type: 'new_request',
        title: 'Shoshilinch e\'lon',
        body: data.title,
        link: '/dashboard/announcements',
      });
    }
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[announcements POST error]', err);
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
    const ref = getAdminDb().collection('announcements').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = { id: snap.id, ...snap.data() } as Announcement;
    if (!canDelete(auth, existing)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await ref.delete();
    await writeAuditLog(auth, 'announcement_deleted', 'announcement', body.id, existing.title);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[announcements DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
