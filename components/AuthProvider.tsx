'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuthFirebase, getDbFirebase, firebaseIsConfigured } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

type AuthCtx = {
  user: User | null;
  profile: UserProfile | null;
  ready: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function useAuth() {
  return useContext(Ctx);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  const configured = firebaseIsConfigured;

  const loadProfile = useCallback(
    async (uid: string): Promise<UserProfile | null> => {
      if (!configured) return null;
      const db = getDbFirebase();
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data() as UserProfile;
      return null;
    },
    [configured]
  );

  useEffect(() => {
    if (!configured) return;
    const unsubscribe = onAuthStateChanged(getAuthFirebase(), async (u) => {
      setUser(u);
      setProfile(u ? await loadProfile(u.uid) : null);
      setReady(true);
    });
    return unsubscribe;
  }, [configured, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) setProfile(await loadProfile(user.uid));
  }, [user, loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getAuthFirebase(), email, password);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(getAuthFirebase(), email, password);
    const createdAt = Date.now();
    await setDoc(doc(getDbFirebase(), 'users', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      role: 'user',
      balance: 0,
      phone: null,
      createdAt,
    } satisfies UserProfile);
  }, []);

  const logout = useCallback(async () => {
    await signOut(getAuthFirebase());
  }, []);

  const value = useMemo(
    () => ({ user, profile, ready, configured, login, register, logout, refreshProfile }),
    [user, profile, ready, configured, login, register, logout, refreshProfile]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}