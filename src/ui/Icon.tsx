// Icon.tsx — minimal line-icon set ported from the design. Stroke = currentColor.
// Presentational only. Usage: <Icon name="search" size={20} />
import type { CSSProperties, ReactElement } from 'react';

export type IconName =
  | 'dashboard' | 'items' | 'count' | 'reports' | 'plus' | 'minus' | 'search' | 'filter'
  | 'chevR' | 'chevL' | 'chevD' | 'x' | 'check' | 'checkCircle' | 'truck' | 'usage' | 'waste'
  | 'archive' | 'bell' | 'arrowUp' | 'arrowDown' | 'signout' | 'user' | 'lock' | 'mail'
  | 'eye' | 'eyeOff' | 'edit' | 'box' | 'alert' | 'clock' | 'note' | 'calendar' | 'monitor'
  | 'phone' | 'trend' | 'history' | 'dot' | 'home' | 'folder' | 'trash' | 'grip' | 'tag'
  | 'copy' | 'download' | 'store' | 'users' | 'userPlus' | 'swap' | 'pin' | 'shield'
  | 'send' | 'inbox';

const ICON_PATHS: Record<IconName, ReactElement> = {
  dashboard: <><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></>,
  items: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3.5" cy="6" r="1.2" /><circle cx="3.5" cy="12" r="1.2" /><circle cx="3.5" cy="18" r="1.2" /></>,
  count: <><path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z" /><rect x="4" y="4.5" width="16" height="17" rx="2.5" /><path d="M8.5 11l2 2 4-4" /><path d="M8.5 16.5h7" /></>,
  reports: <><path d="M4 20V4" /><path d="M4 20h16" /><rect x="7" y="11" width="3" height="6" /><rect x="12" y="7" width="3" height="10" /><rect x="17" y="13" width="3" height="4" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  minus: <line x1="5" y1="12" x2="19" y2="12" />,
  search: <><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>,
  filter: <><line x1="4" y1="7" x2="20" y2="7" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="10" y1="17" x2="14" y2="17" /></>,
  chevR: <polyline points="9 5 16 12 9 19" />,
  chevL: <polyline points="15 5 8 12 15 19" />,
  chevD: <polyline points="5 9 12 16 19 9" />,
  x: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
  check: <polyline points="4 12.5 9.5 18 20 6" />,
  checkCircle: <><circle cx="12" cy="12" r="9" /><polyline points="8 12.2 11 15 16 8.5" /></>,
  truck: <><path d="M2 6h11v9H2z" /><path d="M13 9h4l3 3v3h-7z" /><circle cx="6" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /></>,
  usage: <><path d="M5 4h14l-1.2 4H6.2z" /><path d="M6.2 8l1.3 11.5a1.5 1.5 0 0 0 1.5 1.3h6a1.5 1.5 0 0 0 1.5-1.3L17.8 8" /></>,
  waste: <><path d="M3 6h18" /><path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" /><path d="M5.5 6l1 13.5A1.5 1.5 0 0 0 8 21h8a1.5 1.5 0 0 0 1.5-1.5L18.5 6" /><line x1="10" y1="10.5" x2="10.4" y2="17" /><line x1="14" y1="10.5" x2="13.6" y2="17" /></>,
  archive: <><rect x="3" y="4" width="18" height="4.5" rx="1" /><path d="M5 8.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5" /><line x1="9.5" y1="13" x2="14.5" y2="13" /></>,
  bell: <><path d="M18 8.5A6 6 0 1 0 6 8.5c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  arrowUp: <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="6 11 12 5 18 11" /></>,
  arrowDown: <><line x1="12" y1="5" x2="12" y2="19" /><polyline points="6 13 12 19 18 13" /></>,
  signout: <><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><polyline points="9 8 5 12 9 16" /><line x1="5" y1="12" x2="15" y2="12" /></>,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3.5 6.5 12 13 20.5 6.5" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="2.8" /></>,
  eyeOff: <><path d="M10.5 6.2A9.5 9.5 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-2.7 3.4M6 7.5C3.4 9.2 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4-.85" /><line x1="3" y1="3" x2="21" y2="21" /></>,
  edit: <><path d="M4 20h4l10-10-4-4L4 16v4Z" /><line x1="13.5" y1="6.5" x2="17.5" y2="10.5" /></>,
  box: <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5 12 12l9-4.5M12 12v9" /></>,
  alert: <><path d="M12 3 2 20h20L12 3Z" /><line x1="12" y1="9.5" x2="12" y2="14" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></>,
  note: <><path d="M5 3h9l5 5v13a0 0 0 0 1 0 0H5a0 0 0 0 1 0 0V3Z" /><polyline points="14 3 14 8 19 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="16.5" x2="13" y2="16.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><line x1="3.5" y1="9.5" x2="20.5" y2="9.5" /><line x1="8" y1="3" x2="8" y2="6.5" /><line x1="16" y1="3" x2="16" y2="6.5" /></>,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><line x1="9" y1="21" x2="15" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><line x1="11" y1="18" x2="13" y2="18" /></>,
  trend: <><polyline points="3 16 9 10 13 14 21 6" /><polyline points="21 11 21 6 16 6" /></>,
  history: <><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" /><polyline points="3 4 3 8.5 7.5 8.5" /><polyline points="12 8 12 12 15 14" /></>,
  dot: <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />,
  home: <><path d="M4 11.5 12 4l8 7.5" /><path d="M5.5 10.5V20h13v-9.5" /><path d="M10 20v-5.5h4V20" /></>,
  folder: <><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h7A1.5 1.5 0 0 1 19 9v8.5A1.5 1.5 0 0 1 17.5 19h-13A1.5 1.5 0 0 1 3 17.5z" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></>,
  grip: <><circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none" /></>,
  tag: <><path d="M3 12.5V5a2 2 0 0 1 2-2h7.5L21 11.5 13.5 19z" /><circle cx="8" cy="8" r="1.4" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M5 16V5a1 1 0 0 1 1-1h10" /></>,
  download: <><path d="M12 4v11" /><polyline points="7 11 12 16 17 11" /><path d="M5 20h14" /></>,
  store: <><path d="M4 9.5 5 4h14l1 5.5" /><path d="M3.5 9.5h17a0 0 0 0 1 0 0 3.2 3.2 0 0 1-6.4 0 3.2 3.2 0 0 1-6.4 0 3.2 3.2 0 0 1-4.2 0Z" /><path d="M5 12.5V20h14v-7.5" /><path d="M9.5 20v-4.5h5V20" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6" /><path d="M17.5 14.6c2 .6 3.5 2.5 3.5 4.9" /></>,
  userPlus: <><circle cx="9.5" cy="8" r="3.4" /><path d="M3.5 20c0-3.2 2.7-5.5 6-5.5 1 0 2 .2 2.8.6" /><line x1="18" y1="13" x2="18" y2="20" /><line x1="14.5" y1="16.5" x2="21.5" y2="16.5" /></>,
  swap: <><polyline points="7 4 3.5 7.5 7 11" /><path d="M3.5 7.5H17a3.5 3.5 0 0 1 3.5 3.5" /><polyline points="17 20 20.5 16.5 17 13" /><path d="M20.5 16.5H7A3.5 3.5 0 0 1 3.5 13" /></>,
  pin: <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></>,
  shield: <><path d="M12 3 5 6v5.5c0 4.4 3 7.6 7 9.5 4-1.9 7-5.1 7-9.5V6l-7-3Z" /><polyline points="9 12 11 14 15 9.5" /></>,
  send: <><path d="M21 3 10.5 13.5" /><path d="M21 3l-6.5 18-4-8-8-4L21 3Z" /></>,
  inbox: <><path d="M3 13h5l1.5 2.5h5L16 13h5" /><path d="M5 5h14l2 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5L5 5Z" /></>,
};

export function Icon({
  name, size = 22, strokeWidth = 1.75, style = {}, className = '',
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...style }} className={className}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
