'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import type { UserRole, BaseUser } from '@/types';

interface AuthContextValue {
  user: User | null;
  userProfile: BaseUser | null;
  userRole: UserRole | null;
  profileComplete: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userProfile: null,
  userRole: null,
  profileComplete: false,
  loading: true,
});

const TRIAL_MODE_ENABLED =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_DISABLE_TRIAL_MODE !== 'true';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<BaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();
    const firebaseDb = getFirebaseDb();

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      // ── TRIAL MODE: takes priority over any real Firebase user ──────────────
      const trialRole = TRIAL_MODE_ENABLED && typeof window !== 'undefined'
        ? (localStorage.getItem('trial_role') as UserRole | null)
        : null;
      if (!TRIAL_MODE_ENABLED && typeof window !== 'undefined') {
        localStorage.removeItem('trial_role');
      }
      if (trialRole) {
        // Ensure we have an anonymous Firebase user so Firestore rules pass
        // and pages that check `if (!user) return` don't get stuck
        let anonUser = firebaseUser?.isAnonymous ? firebaseUser : null;
        if (!anonUser) {
          try {
            const cred = await signInAnonymously(firebaseAuth);
            anonUser = cred.user;
          } catch { /* use null — pages will show empty state */ }
        }
        const names: Record<UserRole, string> = {
          admin: 'Demo Admin',
          clinic: 'Demo Klinika',
          doctor: 'Demo Shifokor',
          patient: 'Demo Foydalanuvchi',
        };
        const trialProfile: BaseUser = {
          uid: anonUser?.uid ?? 'trial',
          role: trialRole,
          email: 'demo@trial.uz',
          displayName: names[trialRole],
          profileComplete: true,
          createdAt: new Date().toISOString(),
        };
        // Write trial profile to Firestore so server-side requireApiUser finds the role
        if (anonUser) {
          try {
            await setDoc(doc(firebaseDb, 'users', anonUser.uid), trialProfile, { merge: true });
          } catch { /* Firestore rules may block anonymous writes — API calls will return empty state */ }
        }
        setUser(anonUser);
        setUserRole(trialRole);
        setUserProfile(trialProfile);
        setProfileComplete(true);
        setLoading(false);
        return;
      }
      // ── END TRIAL MODE ───────────────────────────────────────────────────────

      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(firebaseDb, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const profile = snap.data() as BaseUser;
            setUserProfile(profile);
            setUserRole(profile.role);
            setProfileComplete(profile.profileComplete ?? false);
          } else {
            setUserProfile(null);
            setUserRole(null);
            setProfileComplete(false);
          }
        } catch {
          setUserProfile(null);
          setUserRole(null);
          setProfileComplete(false);
        }
      } else {
        setUserProfile(null);
        setUserRole(null);
        setProfileComplete(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, userProfile, userRole, profileComplete, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
