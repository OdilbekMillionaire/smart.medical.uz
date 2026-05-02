import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, writeAuditLog } from '@/lib/server-events';
import type { BaseUser, Message } from '@/types';

const SendMessageSchema = z.object({
  toUserId: z.string().trim().min(1).max(128),
  subject: z.string().trim().min(1).max(250),
  body: z.string().trim().min(1).max(50000),
});

const MarkReadSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

function userLabel(user: Partial<BaseUser> | undefined, fallback: string) {
  return user?.displayName || user?.email || fallback;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const db = getAdminDb();
    const [inboxSnap, sentSnap, usersSnap] = await Promise.all([
      db.collection('messages').where('toUserId', '==', auth.uid).get(),
      db.collection('messages').where('fromUserId', '==', auth.uid).get(),
      db.collection('users').get(),
    ]);

    const inbox = inboxSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Message))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const sent = sentSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Message))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const users = usersSnap.docs
      .map((doc) => {
        const data = doc.data() as Partial<BaseUser>;
        return compactObject({
          uid: doc.id,
          email: data.email ?? '',
          displayName: data.displayName ?? '',
          role: data.role,
          profileComplete: data.profileComplete ?? false,
          createdAt: data.createdAt ?? '',
          photoURL: data.photoURL,
        }) as BaseUser;
      })
      .filter((user) => user.uid !== auth.uid);

    return NextResponse.json({ inbox, sent, users });
  } catch (err) {
    console.error('[messages GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, SendMessageSchema);
    if (body instanceof NextResponse) return body;
    if (body.toUserId === auth.uid) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
    }

    const db = getAdminDb();
    const [senderSnap, recipientSnap] = await Promise.all([
      db.collection('users').doc(auth.uid).get(),
      db.collection('users').doc(body.toUserId).get(),
    ]);
    if (!recipientSnap.exists) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });

    const sender = senderSnap.data() as Partial<BaseUser> | undefined;
    const recipient = recipientSnap.data() as Partial<BaseUser> | undefined;
    const data = compactObject({
      fromUserId: auth.uid,
      fromName: userLabel(sender, auth.email ?? 'User'),
      toUserId: body.toUserId,
      toName: userLabel(recipient, body.toUserId),
      subject: body.subject,
      body: body.body,
      read: false,
      createdAt: new Date().toISOString(),
    }) as Omit<Message, 'id'>;

    const ref = await db.collection('messages').add(data);
    await writeAuditLog(auth, 'message_sent', 'message', ref.id, data.subject);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[messages POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, MarkReadSchema);
    if (body instanceof NextResponse) return body;

    const ref = getAdminDb().collection('messages').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const message = { id: snap.id, ...snap.data() } as Message;
    if (auth.role !== 'admin' && message.toUserId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ref.update({ read: true });
    await writeAuditLog(auth, 'message_marked_read', 'message', body.id, message.subject);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[messages PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
