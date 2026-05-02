import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import type { UserRole } from '@/types';

export interface ApiUser {
  uid: string;
  email?: string;
  role: UserRole;
}

const USER_ROLES: UserRole[] = ['admin', 'clinic', 'doctor', 'patient'];

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

/**
 * Like requireApiUser but does NOT require the user to have a role.
 * Use for endpoints that run during onboarding before the role is written.
 */
export async function requireAuthToken(req: NextRequest): Promise<{ uid: string; email?: string; role: UserRole | null } | NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const tokenRole = decoded.role;
    let role: UserRole | null = isUserRole(tokenRole) ? tokenRole : null;
    if (!role) {
      const snap = await getAdminDb().collection('users').doc(decoded.uid).get();
      const firestoreRole = snap.data()?.role;
      role = isUserRole(firestoreRole) ? firestoreRole : null;
    }
    return { uid: decoded.uid, email: decoded.email, role };
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function requireApiUser(req: NextRequest): Promise<ApiUser | NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const tokenRole = decoded.role;
    let role: UserRole | null = isUserRole(tokenRole) ? tokenRole : null;

    if (!role) {
      const userSnap = await getAdminDb().collection('users').doc(decoded.uid).get();
      const userRole = userSnap.data()?.role;
      role = isUserRole(userRole) ? userRole : null;
    }

    if (!role) {
      return NextResponse.json({ error: 'User role is not configured' }, { status: 403 });
    }

    return { uid: decoded.uid, email: decoded.email, role };
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export function isApiError(value: ApiUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export function requireRole(user: ApiUser, roles: UserRole[]): NextResponse | null {
  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function parseJson<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<T | NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  return parsed.data;
}
