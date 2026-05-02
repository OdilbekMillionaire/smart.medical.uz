import { getAdminDb } from '@/lib/firebase-admin';
import type { ApiUser } from '@/lib/api-auth';
import type { AppNotification } from '@/types';

type NotificationInput = Omit<AppNotification, 'id' | 'createdAt' | 'read'> & {
  createdAt?: string;
  read?: boolean;
};

export function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

export async function writeAuditLog(
  user: ApiUser,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: string
) {
  const now = new Date().toISOString();
  await getAdminDb().collection('audit_logs').add(compactObject({
    userId: user.uid,
    userEmail: user.email ?? '',
    userRole: user.role,
    action,
    resourceType,
    resourceId,
    details,
    createdAt: now,
  }));
}

export async function createServerNotification(input: NotificationInput) {
  await getAdminDb().collection('notifications').add(compactObject({
    ...input,
    read: input.read ?? false,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }));
}

export async function notifyAdmins(input: Omit<NotificationInput, 'userId'>) {
  const adminUsers = await getAdminDb()
    .collection('users')
    .where('role', '==', 'admin')
    .get();

  if (adminUsers.empty) return;

  const now = new Date().toISOString();
  const batch = getAdminDb().batch();
  adminUsers.docs.forEach((adminDoc) => {
    const ref = getAdminDb().collection('notifications').doc();
    batch.set(ref, compactObject({
      ...input,
      userId: adminDoc.id,
      read: input.read ?? false,
      createdAt: input.createdAt ?? now,
    }));
  });
  await batch.commit();
}
