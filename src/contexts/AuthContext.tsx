'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
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
      // ── TRIAL MODE: bypass Firebase auth for demo purposes ──────────────────
      if (!firebaseUser) {
        const trialRole = typeof window !== 'undefined'
          ? (localStorage.getItem('trial_role') as UserRole | null)
          : null;
        if (trialRole) {
          const names: Record<UserRole, string> = {
            admin: 'Demo Admin',
            clinic: 'Demo Klinika',
            doctor: 'Demo Shifokor',
            patient: 'Demo Bemor',
          };
          setUser(null);
          setUserRole(trialRole);
          setUserProfile({
            role: trialRole,
            email: 'demo@trial.uz',
            displayName: names[trialRole],
            profileComplete: true,
            createdAt: new Date().toISOString(),
          } as BaseUser);
          setProfileComplete(true);
          setLoading(false);
          return;
        }
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
