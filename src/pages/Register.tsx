// Register.tsx — create an account. PRESENTATIONAL ONLY.
//
// New accounts have no role/restaurant until an admin grants access (claims are
// set server-side, not in the browser), so after sign-up the user lands on the
// pending-access screen. THE SEAM: the container wires onSubmit to Firebase Auth
// (createUserWithEmailAndPassword) and onBackToLogin to navigation.
import { useState, type FormEvent } from 'react';
import { Icon } from '../ui/Icon';

export function Register({
  onSubmit,
  onBackToLogin,
}: {
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  onBackToLogin: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setErr('Fill in your name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await onSubmit(name.trim(), email.trim(), password);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sign-up failed.');
      setBusy(false);
    }
  };

  return (
    <div className="it-app screen" style={{ background: 'var(--surface)' }}>
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: '0 0 auto', height: 40 }} />
        <div style={{ padding: '0 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18, marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px oklch(0.587 0.224 26 / 0.35)' }}>
              <Icon name="box" size={28} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.03em' }}>Create your account</div>
              <div className="muted-2" style={{ fontSize: 14, marginTop: 3 }}>Join your restaurant group's stockroom</div>
            </div>
          </div>

          <form className="stack" style={{ gap: 11 }} onSubmit={submit}>
            <div className={`search ${err ? 'input--invalid' : ''}`} style={{ height: 46 }}>
              <Icon name="user" size={16} />
              <input type="text" autoComplete="name" placeholder="Full name"
                value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className={`search ${err ? 'input--invalid' : ''}`} style={{ height: 46 }}>
              <Icon name="mail" size={16} />
              <input type="email" inputMode="email" autoComplete="email" placeholder="Email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className={`search ${err ? 'input--invalid' : ''}`} style={{ height: 46 }}>
              <Icon name="lock" size={16} />
              <input type="password" autoComplete="new-password" placeholder="Password (min 6 characters)"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {err && <div className="field-err"><Icon name="alert" size={13} /> {err}</div>}
            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy} style={{ marginTop: 3 }}>
              {busy ? <><span className="spin" /> Creating account…</> : 'Create account'}
            </button>
          </form>

          <div className="field-hint" style={{ marginTop: 11, lineHeight: 1.5 }}>
            New accounts start with no access. After you sign up, an admin grants your role and restaurant — you'll get in once they do.
          </div>

          <div style={{ flex: 1, minHeight: 16 }} />

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 12, paddingBottom: 28, textAlign: 'center' }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={onBackToLogin}>Already have an account? Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}
