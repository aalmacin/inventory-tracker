// primitives.tsx — shared presentational UI built on design-system.css.
// Pure view: no Redux, no hooks beyond local UI, no firebase.
import { useEffect } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from './Icon';

export type StatusKind = 'ok' | 'low' | 'out';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent-soft';

export function Button({
  variant = 'primary', size, block, children, icon, iconRight, className = '', ...rest
}: {
  variant?: ButtonVariant;
  size?: 'lg' | 'sm';
  block?: boolean;
  children?: ReactNode;
  icon?: IconName;
  iconRight?: IconName;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = ['btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 20 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </button>
  );
}

export function Switch({
  on, onChange, ...rest
}: {
  on: boolean;
  onChange: (next: boolean) => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`switch ${on ? 'switch--on' : ''}`}
      onClick={() => onChange(!on)}
      {...rest}
    >
      <span className="switch__knob" />
    </button>
  );
}

// Bottom-sheet modal, portaled to <body>.
export function SheetModal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const node = (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grip" />
        {children}
      </div>
    </>
  );
  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}

export function Empty({
  icon, title, body, action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty__icon"><Icon name={icon} size={26} /></div>
      <div>
        <div className="empty__title">{title}</div>
        <div className="empty__body" style={{ marginTop: 4 }}>{body}</div>
      </div>
      {action}
    </div>
  );
}

// Number stepper (−  value  +). Controlled.
export function Stepper({
  value, onChange, step = 1, min = 0, max = 9999, unit, size,
}: {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  size?: 'lg';
}) {
  return (
    <div className={`stepper ${size === 'lg' ? 'stepper--lg' : ''}`}>
      <button className="stepper__btn" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label="decrease">
        <Icon name="minus" size={size === 'lg' ? 24 : 20} />
      </button>
      <div className="stepper__val">
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, '');
            onChange(v === '' ? 0 : +v);
          }}
          style={{ width: size === 'lg' ? 70 : 50 }}
        />
        {unit && <span className="stepper__unit">{unit}</span>}
      </div>
      <button className="stepper__btn" onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label="increase">
        <Icon name="plus" size={size === 'lg' ? 24 : 20} />
      </button>
    </div>
  );
}

// Flow header — back chevron + title (+ optional eyebrow / trailing slot).
export function FlowHeader({
  title, sub, onBack, backIcon = 'chevL', trailing,
}: {
  title: string;
  sub?: string;
  onBack?: () => void;
  backIcon?: IconName;
  trailing?: ReactNode;
}) {
  return (
    <div className="appbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {onBack && (
          <button className="icon-btn" style={{ marginLeft: -8 }} onClick={onBack} aria-label="back">
            <Icon name={backIcon} size={22} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          {sub && <div className="eyebrow" style={{ marginBottom: 2 }}>{sub}</div>}
          <div className="appbar__title" style={{ fontSize: 19 }}>{title}</div>
        </div>
      </div>
      {trailing}
    </div>
  );
}

export function StatusBadge({ status, children }: { status: StatusKind; children: ReactNode }) {
  return <span className={`badge badge--${status}`}><span className="dot" />{children}</span>;
}

export function Level({ status, pct }: { status: StatusKind; pct: number }) {
  return (
    <div className="level">
      <div className={`level__fill level__fill--${status}`} style={{ width: `${Math.max(pct, status === 'out' ? 0 : 4)}%` }} />
    </div>
  );
}

// Auto-dismissing toast.
export function Toast({ children, onDone, duration = 2200 }: { children: ReactNode; onDone: () => void; duration?: number }) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);
  return <div className="toast">{children}</div>;
}
