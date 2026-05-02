import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb, getGoogleProvider } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserRole, BaseUser } from '@/types';

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
}

import { signInWithPopup } from 'firebase/auth';

export async function loginWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(getFirebaseAuth(), getGoogleProvider());
}

export async function getGoogleRedirectResult(): Promise<UserCredential | null> {
  return getRedirectResult(getFirebaseAuth());
}

export async function logout() {
  return signOut(getFirebaseAuth());
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  role: UserRole
): Promise<void> {
  const currentUser = getFirebaseAuth().currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('Not authenticated');
  }
  const token = await currentUser.getIdToken();
  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ displayName: displayName || email, role }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? 'Failed to create user profile');
  }
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data() as BaseUser;
  return data.role ?? null;
}
