import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateText, REPLY_DRAFT_PROMPT } from '@/lib/vertex-ai';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { compactObject, createServerNotification, writeAuditLog } from '@/lib/server-events';
import { z } from 'zod';
import type { Request } from '@/types';

type RouteContext = { params: Promise<{ id: string }> };

const UpdateRequestSchema = z.object({
  status: z.enum(['received', 'in_review', 'replied', 'closed']).optional(),
  assignedTo: z.string().trim().max(128).optional(),
  draftReplyId: z.string().max(50000).optional(),
  generateDraftReply: z.boolean().optional(),
});

function canAccessRequest(user: { uid: string; role: string }, request: Request): boolean {
  return user.role === 'admin' || request.fromUserId === user.uid || request.toClinicId === user.uid;
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const db = getAdminDb();
    const snap = await db.collection('requests').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const request = { id: snap.id, ...snap.data() } as Request;
    if (!canAccessRequest(auth, request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(request);
  } catch (err: unknown) {
    console.error('[request GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const db = getAdminDb();

    const snap = await db.collection('requests').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = snap.data() as Request;

    if (!canAccessRequest(auth, existing)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (auth.role !== 'admin' && existing.toClinicId !== auth.uid) {
      return NextResponse.json({ error: 'Only recipient clinic or admin can update requests' }, { status: 403 });
    }

    const body = await parseJson(req, UpdateRequestSchema);
    if (body instanceof NextResponse) return body;

    let draftReply: string | undefined;
    if (body.generateDraftReply) {
      try {
        draftReply = await generateText(
          REPLY_DRAFT_PROMPT,
          `Mavzu: ${existing.subject}\n\nMatn: ${existing.body}`
        );
      } catch {
        // silent
      }
    }

    const updates: Partial<Request> = { ...body };
    delete (updates as Record<string, unknown>).generateDraftReply;
    if (draftReply) updates.draftReplyId = draftReply;

    const cleanUpdates = compactObject(updates as Record<string, unknown>);
    await db.collection('requests').doc(id).update(cleanUpdates);
    const merged = Object.assign({}, existing, cleanUpdates, { id }) as Request;
    await writeAuditLog(
      auth,
      body.status ? `request_${body.status}` : 'request_updated',
      'request',
      id,
      existing.subject
    );
    if (body.status === 'replied' && existing.fromUserId !== auth.uid) {
      await createServerNotification({
        userId: existing.fromUserId,
        type: 'request_replied',
        title: 'Murojaatingizga javob berildi',
        body: existing.subject,
        link: `/dashboard/requests/${id}`,
      });
    }
    return NextResponse.json(merged);
  } catch (err: unknown) {
    console.error('[request PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
