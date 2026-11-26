'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  DAILY_ACTION_LIMIT,
  OperationType,
  auth,
  db,
  getUtcDateKey,
  handleFirestoreError,
  testConnection,
} from '@/lib/firebase';

export type QuotaActionType = 'import' | 'lookup' | 'analyze';

export interface QuotaState {
  dateKey: string;
  actionCount: number;
  limit: number;
  loading: boolean;
}

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  signingIn: boolean;
  authError: string | null;
  quota: QuotaState;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  consumeDailyAction: (actionType: QuotaActionType) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaState>({
    dateKey: getUtcDateKey(),
    actionCount: 0,
    limit: DAILY_ACTION_LIMIT,
    loading: true,
  });

  useEffect(() => {
    void testConnection();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      setQuota({
        dateKey: getUtcDateKey(),
        actionCount: 0,
        limit: DAILY_ACTION_LIMIT,
        loading: Boolean(firebaseUser),
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    const quotaPath = `userQuotas/${user.uid}`;
    const quotaRef = doc(db, 'userQuotas', user.uid);
    const today = getUtcDateKey();

    const unsubscribe = onSnapshot(
      quotaRef,
      (snap) => {
        const currentToday = getUtcDateKey();
        if (!snap.exists()) {
          // Initialize quota doc on first sign-in
          setDoc(quotaRef, {
            ownerId: user.uid,
            dateKey: currentToday,
            actionCount: 0,
            lastActionType: 'init',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).catch((err) => {
            handleFirestoreError(err, OperationType.CREATE, quotaPath);
          });
          setQuota({
            dateKey: currentToday,
            actionCount: 0,
            limit: DAILY_ACTION_LIMIT,
            loading: false,
          });
          return;
        }

        const data = snap.data();
        const docDate = typeof data.dateKey === 'string' ? data.dateKey : today;
        const rawCount =
          typeof data.actionCount === 'number' ? data.actionCount : 0;

        setQuota({
          dateKey: currentToday,
          actionCount: docDate === currentToday ? rawCount : 0,
          limit: DAILY_ACTION_LIMIT,
          loading: false,
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, quotaPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      if (!cred.user.emailVerified) {
        await signOut(auth);
        setAuthError('unverified');
      }
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError('popup-closed');
      } else {
        setAuthError('generic');
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
  }, []);

  const consumeDailyAction = useCallback(
    async (actionType: QuotaActionType): Promise<boolean> => {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      const quotaPath = `userQuotas/${currentUser.uid}`;
      const quotaRef = doc(db, 'userQuotas', currentUser.uid);
      const today = getUtcDateKey();

      try {
        const allowed = await runTransaction(db, async (tx) => {
          const snap = await tx.get(quotaRef);
          if (!snap.exists()) {
            tx.set(quotaRef, {
              ownerId: currentUser.uid,
              dateKey: today,
              actionCount: 1,
              lastActionType: actionType,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            return true;
          }

          const data = snap.data();
          const docDate = typeof data.dateKey === 'string' ? data.dateKey : '';
          const currentCount =
            typeof data.actionCount === 'number' ? data.actionCount : 0;

          if (docDate !== today) {
            tx.update(quotaRef, {
              dateKey: today,
              actionCount: 1,
              lastActionType: actionType,
              updatedAt: serverTimestamp(),
            });
            return true;
          }

          if (currentCount >= DAILY_ACTION_LIMIT) {
            return false;
          }

          tx.update(quotaRef, {
            dateKey: today,
            actionCount: currentCount + 1,
            lastActionType: actionType,
            updatedAt: serverTimestamp(),
          });
          return true;
        });

        return allowed;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('Missing or insufficient permissions') || msg.includes('PERMISSION_DENIED')) {
          handleFirestoreError(error, OperationType.WRITE, quotaPath);
        }
        throw error;
      }
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        signingIn,
        authError,
        quota,
        signInWithGoogle,
        signOutUser,
        consumeDailyAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
