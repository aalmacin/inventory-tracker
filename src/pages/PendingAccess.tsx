// PendingAccess.tsx — shown to a signed-in user who has no role yet.
// PRESENTATIONAL ONLY. A freshly registered account has no role/restaurant
// claims until an admin grants access; this is the holding screen until then.
import { Icon } from '../ui/Icon';

export function PendingAccess({
  userName,
  onSignOut,
}: {
  userName?: string;
  onSignOut: () => void;
}) {
  return (
    <div className="it-app screen" style={{ background: 'var(--surface)' }}>
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="empty" style={{ flex: 1, justifyContent: 'center', padding: '32px 30px' }}>
          <div style={{ width: 60, height: 60, borderRadius: 17, background: 'var(--accent-weak)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="clock" size={28} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em' }}>Account pending access</div>
            <div className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55, maxWidth: 320 }}>
              {userName ? `Thanks, ${userName} — your` : 'Your'} account is created, but an admin hasn't granted you a
              role and restaurant yet. You'll be able to start once they do.
            </div>
          </div>
          <button className="btn btn--secondary btn--sm" style={{ marginTop: 6 }} onClick={onSignOut}>
            <Icon name="signout" size={15} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
