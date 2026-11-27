import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase';
import { subscribeRole } from '../lib/store';

const AuthContext = createContext(null);
const DEMO_USER = { uid: 'demo-member', displayName: 'Demo member', email: 'demo@local.invalid', isDemo: true };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => !isFirebaseConfigured && sessionStorage.getItem('gc-demo-login') === '1' ? DEMO_USER : null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [role, setRole] = useState(null);
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }, () => setLoading(false));
  }, []);
  useEffect(() => subscribeRole(user?.uid, setRole), [user?.uid]);
  const value = useMemo(() => ({
    user, loading, role, isFirebaseConfigured,
    signInEmail: ({ email, password }) => {
      if (!isFirebaseConfigured) throw new Error('Email sign-in needs Firebase configuration. Try the demo account.');
      return signInWithEmailAndPassword(auth, email, password);
    },
    signUpEmail: async ({ email, password, displayName }) => {
      if (!isFirebaseConfigured) throw new Error('Account registration needs Firebase configuration.');
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName?.trim()) {
        await updateProfile(credentials.user, { displayName: displayName.trim().slice(0, 50) });
        setUser(credentials.user);
      }
      return credentials;
    },
    signInGoogle: () => {
      if (!isFirebaseConfigured) throw new Error('Google sign-in needs Firebase configuration.');
      return signInWithPopup(auth, googleProvider);
    },
    signInDemo: () => {
      if (isFirebaseConfigured) throw new Error('Demo sign-in is not available in production.');
      sessionStorage.setItem('gc-demo-login', '1');
      setUser(DEMO_USER);
    },
    signOut: async () => {
      if (isFirebaseConfigured) await firebaseSignOut(auth);
      else { sessionStorage.removeItem('gc-demo-login'); setUser(null); }
    },
  }), [user, loading, role]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw Error('useAuth must be used within AuthProvider');
  return ctx;
}
