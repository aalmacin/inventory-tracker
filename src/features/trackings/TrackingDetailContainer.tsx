import { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { TrackingDetail } from '../../pages/TrackingDetail';
import { useAppSelector } from '../../lib/hooks';
import * as fs from './firestore';
import { hasQty } from '../../lib/units';

export function TrackingDetailContainer() {
  const nav = useNavigate();
  const { id = '' } = useParams();
  const rid = useAppSelector((s) => s.restaurants.currentId);
  const t = useAppSelector((s) => s.trackings.list.find((x) => x.id === id));
  const cats = useAppSelector((s) => s.catalog.categories);
  const items = useAppSelector((s) => s.catalog.items);

  const vm = useMemo(
    () =>
      t
        ? {
            id: t.id,
            dateMs: t.date,
            by: t.by,
            note: t.note,
            categories: [...cats]
              .sort((a, b) => a.order - b.order)
              .map((c) => ({
                id: c.id,
                label: c.label,
                rows: items
                  .filter((i) => i.category === c.id)
                  .map((i) => ({ i, line: t.lines[i.id] }))
                  .filter((r) => r.line && (hasQty(r.line.inv) || hasQty(r.line.ord)))
                  .map((r) => ({ itemId: r.i.id, name: r.i.name, inv: r.line.inv, ord: r.line.ord, dlv: r.line.dlv })),
              }))
              .filter((c) => c.rows.length),
          }
        : null,
    [t, cats, items],
  );

  if (!rid) return null;
  if (!vm) return <Navigate to="/home" replace />;

  return (
    <TrackingDetail
      tracking={vm}
      onSetDelivery={(itemId, dlv) => fs.setDelivery(rid, id, itemId, dlv)}
      onEdit={() => nav(`/track/${id}/edit`)}
      onDelete={async () => {
        await fs.deleteTracking(rid, id);
        nav('/home');
      }}
      onBack={() => nav(-1)}
    />
  );
}
