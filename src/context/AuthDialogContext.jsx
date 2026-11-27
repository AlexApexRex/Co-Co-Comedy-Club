import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
const Context = createContext(null);

export function AuthDialogProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const first = useRef(null);
  const previousFocus = useRef(null);
  const auth = useAuth();
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement;
    first.current?.focus();
    const key = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab') {
        const focusable = [...document.querySelectorAll('[data-auth-dialog] button:not(:disabled), [data-auth-dialog] input:not(:disabled)')];
        if (!focusable.length) return;
        const index = focusable.indexOf(document.activeElement);
        if (e.shiftKey && index <= 0) { e.preventDefault(); focusable[focusable.length - 1].focus(); }
        else if (!e.shiftKey && index === focusable.length - 1) { e.preventDefault(); focusable[0].focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previousFocus.current?.focus?.(); };
  }, [open]);
  const close = () => { if (!busy) setOpen(false); };
  const openDialog = (next = 'login') => { setMode(next); setError(''); setOpen(true); };
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'signup') await auth.signUpEmail({ email: values.email.trim(), password: values.password, displayName: values.name });
      else await auth.signInEmail({ email: values.email.trim(), password: values.password });
      setOpen(false);
    } catch (err) { setError(err?.message || 'Sign-in failed. Try again.'); }
    finally { setBusy(false); }
  };
  const google = async () => {
    setBusy(true); setError('');
    try { await auth.signInGoogle(); setOpen(false); }
    catch (err) { setError(err?.message || 'Google sign-in failed.'); }
    finally { setBusy(false); }
  };
  return <Context.Provider value={openDialog}>
    {children}
    {open && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div data-auth-dialog role="dialog" aria-modal="true" aria-labelledby="auth-title" className="modal-sheet">
        <div className="flex justify-between items-start gap-3">
          <span className="eyebrow">YOUR CORNER OF THE INTERNET</span>
          <button className="icon-button" type="button" onClick={close} aria-label="Close sign-in dialog">✕</button>
        </div>
        <h2 id="auth-title" className="font-display text-3xl font-semibold mt-4">{mode === 'signup' ? 'Join the conversation.' : 'Welcome back.'}</h2>
        <p className="muted mt-2">An account is only needed to vote. Sharing, reading, and commenting are open to everyone.</p>
        {!auth.isFirebaseConfigured ? <div className="notice mt-6"><strong>Preview mode</strong><p>Real accounts aren't available without Firebase. Use the demo member to try voting locally.</p></div> : null}
        {auth.isFirebaseConfigured ? <>
          <form onSubmit={submit} className="form-stack mt-6">
            {mode === 'signup' && <label>Display name <input ref={first} className="field" required maxLength={50} autoComplete="name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })}/></label>}
            <label>Email <input ref={mode === 'login' ? first : undefined} className="field" type="email" autoComplete="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })}/></label>
            <label>Password <input className="field" type="password" minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })}/></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
          </form>
          <button className="btn btn-outline w-full mt-3" disabled={busy} onClick={google}>Continue with Google</button>
          <p className="text-center muted mt-5 text-sm">{mode === 'login' ? 'New around here?' : 'Already have an account?'} <button className="text-link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in instead'}</button></p>
        </> : <button ref={first} className="btn btn-primary w-full mt-6" onClick={() => { auth.signInDemo(); setOpen(false); }}>Try demo member</button>}
        <p className="text-center muted mt-4 text-xs">No account? Just close this window and keep exploring.</p>
      </div>
    </div>}
  </Context.Provider>;
}
export function useAuthDialog() {
  const fn = useContext(Context);
  if (!fn) throw Error('AuthDialogProvider missing');
  return fn;
}
