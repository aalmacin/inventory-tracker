// Login.tsx — email/password sign-in. PRESENTATIONAL ONLY.
//
// THE SEAM: the screen collects an email + password and calls onSubmit; the
// container wires it to Firebase Auth (signInWithEmailAndPassword). To try a
// role in dev, sign in with a seeded account (`yarn seed`) — e.g.
// admin@riverside.co / kitchen. The "Demo accounts" quick-fill is dev-only and
// hidden in production via the showDemo prop.
import { useState, type FormEvent } from 'react';
import { Icon } from '../ui/Icon';

export type Role = 'admin' | 'manager' | 'supervisor';

export interface DemoLogin {
  label: string;
  email: string;
}

const DEFAULT_DEMO_LOGINS: DemoLogin[] = [
  { label: 'Alex Rivera · Admin', email: 'admin@riverside.co' },
  { label: 'Maya Chen · Manager', email: 'manager@riverside.co' },
  { label: 'Diego Park · Supervisor', email: 'supervisor@riverside.co' },
  { label: 'Sara Okafor · Supervisor', email: 'sara@lakeshore.co' },
  { label: 'Priya Nair · Manager', email: 'priya@lakeshore.co' },
];

export function Login({
  onSubmit,
  onRegister,
  demoLogins = DEFAULT_DEMO_LOGINS,
  demoPassword = 'kitchen',
  showDemo = true,
}: {
  onSubmit: (email: string, password: string) => Promise<void>;
  onRegister?: () => void;
  demoLogins?: DemoLogin[];
  demoPassword?: string;
  showDemo?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErr('Enter your email and password.');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await onSubmit(email.trim(), password);
      // success navigates away; leave busy on so the button stays disabled
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sign-in failed.');
      setBusy(false);
    }
  };

  const fillDemo = (d: DemoLogin) => {
    setEmail(d.email);
    setPassword(demoPassword);
    setErr(null);
  };

  return (
    <div className="it-app screen" style={{ background: 'var(--surface)' }}>
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: '0 0 auto', height: 34 }} />
        <div style={{ padding: '0 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18, marginBottom: 30 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px oklch(0.587 0.224 26 / 0.35)' }}>
              <Icon name="box" size={28} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.03em' }}>Inventory Tracker</div>
              <div className="muted-2" style={{ fontSize: 14, marginTop: 3 }}>Stockroom counts &amp; orders, by restaurant</div>
            </div>
          </div>

          <div className="eyebrow" style={{ marginBottom: 12 }}>Sign in</div>

          <form className="stack" style={{ gap: 11 }} onSubmit={submit}>
            <div className={`search ${err ? 'input--invalid' : ''}`} style={{ height: 46 }}>
              <Icon name="mail" size={16} />
              <input type="email" inputMode="email" autoComplete="username" placeholder="Email"
                value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </div>
            <div className={`search ${err ? 'input--invalid' : ''}`} style={{ height: 46 }}>
              <Icon name="lock" size={16} />
              <input type="password" autoComplete="current-password" placeholder="Password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {err && <div className="field-err"><Icon name="alert" size={13} /> {err}</div>}
            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy} style={{ marginTop: 3 }}>
              {busy ? <><span className="spin" /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          {onRegister && (
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <span className="t-sm muted">Don't have an account? </span>
              <button type="button" className="btn btn--ghost btn--sm" style={{ height: 'auto', padding: '2px 6px', color: 'var(--accent-text)' }} onClick={onRegister}>Register</button>
            </div>
          )}

          {showDemo && (
            <div style={{ marginTop: 24 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Demo accounts</div>
              <div className="stack" style={{ gap: 8 }}>
                {demoLogins.map((d) => (
                  <button key={d.email} type="button" className="role-card" style={{ alignItems: 'center', padding: '12px 14px' }} onClick={() => fillDemo(d)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="role-card__title">{d.label}</div>
                      <div className="role-card__meta" style={{ marginTop: 4 }}>{d.email}</div>
                    </div>
                    <span className="t-sm muted">Use &rarr;</span>
                  </button>
                ))}
              </div>
              <div className="field-hint" style={{ marginTop: 9 }}>
                All demo accounts use the password <code>{demoPassword}</code>. Run <code>yarn seed</code> to create them.
              </div>
            </div>
          )}

          <div style={{ flex: 1, minHeight: 16 }} />
        </div>
      </div>
    </div>
  );
}
