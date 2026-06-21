// Login.tsx — role-picker sign-in. PRESENTATIONAL ONLY.
//
// THE SEAM: the screen renders the personas you pass and calls onPick when one
// is chosen (it shows a brief local "signing in" state). Your container wires
// onPick to real auth (Firebase Auth) + sets the current user/role in Redux.
import { useState } from 'react';
import { Icon, type IconName } from '../ui/Icon';

export type Role = 'admin' | 'manager' | 'supervisor';

export interface Persona {
  key: string;            // your auth identifier
  role: Role;
  name: string;
  desc: string;
  meta: string;           // e.g. "Riverside + Lakeshore"
  icon: IconName;
}

const ROLE_LABEL: Record<Role, string> = { admin: 'Admin', manager: 'Manager', supervisor: 'Supervisor' };

// Sensible default personas matching the design; the container can override.
const DEFAULT_PERSONAS: Persona[] = [
  { key: 'admin', role: 'admin', name: 'Alex Rivera', desc: 'Manages restaurants, catalogs, and who has access.', meta: 'All restaurants · no tracking', icon: 'shield' },
  { key: 'manager', role: 'manager', name: 'Maya Chen', desc: 'Records inventory tracking. Switches between locations.', meta: 'Riverside + Lakeshore', icon: 'users' },
  { key: 'supervisor', role: 'supervisor', name: 'Diego Park', desc: 'Records inventory tracking for their restaurant.', meta: 'Riverside Sushi & Boba', icon: 'user' },
];

function RoleCard({ persona, onPick }: { persona: Persona; onPick: () => void }) {
  return (
    <button className="role-card" onClick={onPick}>
      <div className={`role-card__icon role-tag--${persona.role}`}>
        <Icon name={persona.icon} size={22} strokeWidth={1.9} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className="role-card__title">{persona.name}</span>
          <span className={`role-tag role-tag--${persona.role}`}>{ROLE_LABEL[persona.role]}</span>
        </div>
        <div className="role-card__desc">{persona.desc}</div>
        <div className="role-card__meta"><Icon name="store" size={13} /> {persona.meta}</div>
      </div>
      <span style={{ color: 'var(--ink-4)', alignSelf: 'center' }}><Icon name="chevR" size={18} /></span>
    </button>
  );
}

export function Login({
  personas = DEFAULT_PERSONAS,
  onPick,
}: {
  personas?: Persona[];
  onPick: (persona: Persona) => void;
}) {
  const [busy, setBusy] = useState<Persona | null>(null);

  const pick = (persona: Persona) => {
    setBusy(persona);
    onPick(persona);
  };

  return (
    <div className="it-app screen" style={{ background: 'var(--surface)' }}>
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: '0 0 auto', height: 34 }} />
        <div style={{ padding: '0 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18, marginBottom: 30 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px oklch(0.52 0.083 194 / 0.35)' }}>
              <Icon name="box" size={28} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.03em' }}>Inventory Tracker</div>
              <div className="muted-2" style={{ fontSize: 14, marginTop: 3 }}>Stockroom counts &amp; orders, by restaurant</div>
            </div>
          </div>

          <div className="eyebrow" style={{ marginBottom: 12 }}>Choose a role to explore</div>

          <div className="stack" style={{ gap: 11 }}>
            {personas.map((p) => <RoleCard key={p.key} persona={p} onPick={() => pick(p)} />)}
          </div>

          {busy && (
            <div className="login-busy">
              <span className="spin" /> Signing in as {ROLE_LABEL[busy.role]}…
            </div>
          )}

          <div style={{ flex: 1, minHeight: 16 }} />

          <div style={{ borderTop: '1px solid var(--border)', margin: '24px 0 0', paddingTop: 14, paddingBottom: 28 }}>
            <div className="t-sm muted" style={{ lineHeight: 1.55 }}>
              Pick any role to step into its experience — you can sign out and switch roles at any time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
