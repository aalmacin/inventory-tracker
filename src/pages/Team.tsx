// Team.tsx — admin manages who can access restaurants. PRESENTATIONAL ONLY.
//
// THE SEAM: the container passes members + restaurants from Redux/Firestore and
// implements onInvite / onUpdateMember / onRemoveMember / onResend. The actual
// invite (creating the auth user + custom claims) is a Cloud Function you call
// from those callbacks — never from this component.
import { useState, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import { Button, Empty, SheetModal } from '../ui/primitives';
import type { RestaurantVM } from '../ui/shell';

export type Role = 'manager' | 'supervisor';
const ROLE_LABEL: Record<Role, string> = { manager: 'Manager', supervisor: 'Supervisor' };

export interface MemberVM {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'pending';
  restaurantIds: string[];
}
export interface MemberInput {
  name: string;
  email: string;
  role: Role;
  restaurantIds: string[];
}

const initials = (name: string) => (name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// ── restaurant chips on a member row ─────────────────────────
function RestTags({ ids, restaurants }: { ids: string[]; restaurants: RestaurantVM[] }) {
  const list = restaurants.filter((r) => ids.includes(r.id));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
      {list.map((r) => (
        <span key={r.id} className="mini-chip">
          <span className="mini-chip__dot" style={{ background: r.tint }} />
          {r.name}
        </span>
      ))}
    </div>
  );
}

// ── invite / manage member sheet ─────────────────────────────
function MemberSheet({
  member, defaultRestId, restaurants, onInvite, onUpdate, onRemove, onResend, onClose,
}: {
  member: MemberVM | null;
  defaultRestId: string | null;
  restaurants: RestaurantVM[];
  onInvite: (input: MemberInput) => void;
  onUpdate: (id: string, input: MemberInput) => void;
  onRemove: (id: string) => void;
  onResend: (id: string) => void;
  onClose: () => void;
}) {
  const isEdit = !!member;
  const [name, setName] = useState(member ? member.name : '');
  const [email, setEmail] = useState(member ? member.email : '');
  const [role, setRole] = useState<Role>(member ? member.role : 'supervisor');
  const [rids, setRids] = useState<string[]>(member ? [...member.restaurantIds] : (defaultRestId ? [defaultRestId] : []));
  const [touched, setTouched] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const errEmail = touched && !emailOk;
  const errRest = touched && rids.length === 0;
  const toggleRest = (id: string) => setRids((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = () => {
    setTouched(true);
    if (!emailOk || rids.length === 0) return;
    const input: MemberInput = { name: name.trim(), email: email.trim(), role, restaurantIds: rids };
    if (isEdit && member) onUpdate(member.id, input);
    else onInvite(input);
    onClose();
  };

  if (confirmRemove && member) {
    return (
      <SheetModal onClose={() => setConfirmRemove(false)}>
        <div style={{ padding: '20px 20px 8px' }}>
          <div className="t-lg fw-7">Remove {member.name}?</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
            They&rsquo;ll lose access to all assigned restaurants. Inventory trackings they recorded stay attached to the restaurant.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            <Button variant="danger" size="lg" block icon="trash" onClick={() => { onRemove(member.id); onClose(); }}>Remove member</Button>
            <Button variant="ghost" size="lg" block onClick={() => setConfirmRemove(false)}>Cancel</Button>
          </div>
        </div>
      </SheetModal>
    );
  }

  return (
    <SheetModal onClose={onClose}>
      <div style={{ padding: '18px 20px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="t-lg fw-7">{isEdit ? 'Manage access' : 'Invite to restaurant'}</div>
          {isEdit && member?.status === 'pending' && (
            <span className="mini-chip" style={{ background: 'var(--low-bg)', borderColor: 'var(--low-line)', color: 'var(--low-text)' }}>
              <span className="mini-chip__dot" style={{ background: 'var(--low)' }} />Pending
            </span>
          )}
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label className="label">Name <span className="muted-2" style={{ fontWeight: 500 }}>· optional</span></label>
            <input className="input" value={name} placeholder="e.g. Jordan Lee" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Email <span className="req">*</span></label>
            <div className={`search ${errEmail ? 'input--invalid' : ''}`} style={{ height: 46 }}>
              <span style={{ color: 'var(--ink-3)' }}><Icon name="mail" size={18} /></span>
              <input type="email" value={email} placeholder="name@restaurant.co" onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
            </div>
            {errEmail && <div className="field-err"><Icon name="alert" size={13} /> Enter a valid email address.</div>}
          </div>

          <div className="field">
            <label className="label">Role</label>
            <div className="seg">
              <button className={`seg__opt ${role === 'manager' ? 'seg__opt--active' : ''}`} onClick={() => setRole('manager')}><Icon name="users" size={17} /> Manager</button>
              <button className={`seg__opt ${role === 'supervisor' ? 'seg__opt--active' : ''}`} onClick={() => setRole('supervisor')}><Icon name="user" size={17} /> Supervisor</button>
            </div>
            <div className="field-hint">Managers and supervisors both record inventory tracking. Managers can be assigned to multiple restaurants.</div>
          </div>

          <div className="field">
            <label className="label">Restaurant access <span className="req">*</span></label>
            <div className="stack" style={{ gap: 8 }}>
              {restaurants.map((r) => {
                const on = rids.includes(r.id);
                return (
                  <button key={r.id} className={`check-row ${on ? 'is-on' : ''}`} onClick={() => toggleRest(r.id)}>
                    <span className="check-box">{on && <Icon name="check" size={15} strokeWidth={3} />}</span>
                    <span className="rest-chip__avatar" style={{ width: 28, height: 28, fontSize: 10, background: r.tint }}>{r.initials}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="fw-6 t-sm" style={{ display: 'block' }}>{r.name}</span>
                      <span className="muted-2" style={{ fontSize: 11.5 }}>{r.city}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {errRest && <div className="field-err"><Icon name="alert" size={13} /> Assign at least one restaurant.</div>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          <Button variant="primary" size="lg" block icon={isEdit ? 'check' : 'send'} onClick={submit}>{isEdit ? 'Save changes' : 'Send invitation'}</Button>
          {isEdit && member?.status === 'pending' && (
            <Button variant="secondary" block icon="send" onClick={() => { onResend(member.id); onClose(); }}>Resend invitation</Button>
          )}
          {isEdit && member ? (
            <Button variant="danger" block icon="trash" onClick={() => setConfirmRemove(true)}>{member.status === 'pending' ? 'Cancel invitation' : 'Remove member'}</Button>
          ) : (
            <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          )}
        </div>
      </div>
    </SheetModal>
  );
}

function MemberRow({ m, restaurants, onOpen }: { m: MemberVM; restaurants: RestaurantVM[]; onOpen: () => void }) {
  return (
    <button className="card" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '13px 14px' }} onClick={onOpen}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div className="acct-avatar" style={{ width: 38, height: 38, fontSize: 13, background: m.status === 'pending' ? 'var(--ink-4)' : 'var(--ink)' }}>{initials(m.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span className="fw-7" style={{ fontSize: 14.5 }}>{m.name}</span>
            <span className={`role-tag role-tag--${m.role}`}>{ROLE_LABEL[m.role]}</span>
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{m.email}</div>
        </div>
        {m.status === 'pending'
          ? <span className="mini-chip" style={{ background: 'var(--low-bg)', borderColor: 'var(--low-line)', color: 'var(--low-text)' }}><span className="mini-chip__dot" style={{ background: 'var(--low)' }} />Pending</span>
          : <span style={{ color: 'var(--ink-4)' }}><Icon name="chevR" size={17} /></span>}
      </div>
      <RestTags ids={m.restaurantIds} restaurants={restaurants} />
    </button>
  );
}

export function Team({
  header, members, restaurants, currentRestaurant, onInvite, onUpdateMember, onRemoveMember, onResend,
}: {
  header?: ReactNode;
  members: MemberVM[];
  restaurants: RestaurantVM[];
  currentRestaurant: { id: string; name: string; initials: string } | null;
  onInvite: (input: MemberInput) => void;
  onUpdateMember: (id: string, input: MemberInput) => void;
  onRemoveMember: (id: string) => void;
  onResend: (id: string) => void;
}) {
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [sheet, setSheet] = useState<{ member: MemberVM | null } | null>(null);

  const inScope = (m: MemberVM) => scope === 'all' || (currentRestaurant ? m.restaurantIds.includes(currentRestaurant.id) : true);
  const visible = members.filter(inScope);
  const pending = visible.filter((m) => m.status === 'pending');
  const active = visible.filter((m) => m.status !== 'pending');

  return (
    <div className="it-app screen">
      {header ?? (
        <div className="appbar">
          <div className="appbar__title">Team</div>
          <button className="btn btn--primary btn--sm" onClick={() => setSheet({ member: null })}><Icon name="userPlus" size={15} /> Invite</button>
        </div>
      )}
      <div className="scroll">
        <div className="pad stack" style={{ gap: 13 }}>
          <div className="seg">
            <button className={`seg__opt ${scope === 'current' ? 'seg__opt--active' : ''}`} onClick={() => setScope('current')}>{currentRestaurant?.initials || 'This'} only</button>
            <button className={`seg__opt ${scope === 'all' ? 'seg__opt--active' : ''}`} onClick={() => setScope('all')}>All restaurants</button>
          </div>

          <Button variant="primary" block icon="userPlus" onClick={() => setSheet({ member: null })}>Invite a teammate</Button>

          {scope === 'current' && currentRestaurant && (
            <div className="t-sm muted" style={{ padding: '0 2px', lineHeight: 1.5 }}>
              People with access to <span className="fw-6" style={{ color: 'var(--ink)' }}>{currentRestaurant.name}</span>.
            </div>
          )}

          {pending.length > 0 && (
            <section>
              <div className="eyebrow" style={{ marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="inbox" size={14} /> Pending invitations <span className="mono" style={{ color: 'var(--low-text)' }}>{pending.length}</span>
              </div>
              <div className="stack" style={{ gap: 10 }}>
                {pending.map((m) => <MemberRow key={m.id} m={m} restaurants={restaurants} onOpen={() => setSheet({ member: m })} />)}
              </div>
            </section>
          )}

          <section>
            <div className="eyebrow" style={{ marginBottom: 9 }}>Members <span className="mono" style={{ color: 'var(--ink-3)' }}>{active.length}</span></div>
            {active.length === 0 ? (
              <div className="card"><Empty icon="users" title="No members yet" body="Invite a manager or supervisor to give them access." action={<Button variant="primary" icon="userPlus" onClick={() => setSheet({ member: null })}>Invite someone</Button>} /></div>
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                {active.map((m) => <MemberRow key={m.id} m={m} restaurants={restaurants} onOpen={() => setSheet({ member: m })} />)}
              </div>
            )}
          </section>

          <div className="content-pad-bottom" />
        </div>
      </div>

      {sheet && (
        <MemberSheet
          member={sheet.member}
          defaultRestId={currentRestaurant?.id ?? null}
          restaurants={restaurants}
          onInvite={onInvite}
          onUpdate={onUpdateMember}
          onRemove={onRemoveMember}
          onResend={onResend}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
