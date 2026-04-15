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
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
  const userData: Omit<BaseUser, 'uid'> = {
    email,
    displayName,
    role,
    profileComplete: false,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(getFirebaseDb(), 'users', uid), { uid, ...userData });
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data() as BaseUser;
  return data.role ?? null;
}
