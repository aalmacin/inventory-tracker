import { useNavigate } from 'react-router-dom';
import { Home, type DeliveryStatus } from '../../pages/Home';
import { AppHeader } from '../../ui/shell';
import { useAppSelector } from '../../lib/hooks';
import { useChrome } from '../../app/useChrome';
import type { TrackingLine } from '../trackings/types';

const has = (v: unknown): v is number => v !== undefined && v !== null;

function deliveryStatus(lines: Record<string, TrackingLine>): DeliveryStatus {
  const ordered = Object.values(lines).filter((l) => has(l.ord));
  if (!ordered.length) return { kind: 'none' };
  const open = ordered.filter((l) => !l.dlv).length;
  return open === 0 ? { kind: 'done' } : { kind: 'pending', open, total: ordered.length };
}

export function HomeContainer() {
  const nav = useNavigate();
  const chrome = useChrome();
  const list = useAppSelector((s) => s.trackings.list);
  const itemCount = useAppSelector((s) => s.catalog.items.filter((i) => !i.disabled).length);

  const trackings = list.map((t) => ({ id: t.id, date: t.date, note: t.note, delivery: deliveryStatus(t.lines) }));

  return (
    <Home
      header={<AppHeader title="Inventory" sub={chrome.restaurantName} switcher={chrome.switcher} account={chrome.account} />}
      trackings={trackings}
      itemCount={itemCount}
      onNewTracking={() => nav('/track/new')}
      onOpenTracking={(id) => nav(`/track/${id}`)}
      onBrowseItems={() => nav('/items')}
    />
  );
}
