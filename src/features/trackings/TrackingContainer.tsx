import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tracking, type Lines } from '../../pages/Tracking';
import { useAppSelector } from '../../lib/hooks';
import * as fs from './firestore';
import type { TrackingLine } from './types';

// recently-used values for an item, newest-first, deduped
function makeRecent(list: { lines: Record<string, TrackingLine> }[], field: 'inv' | 'ord') {
  return (itemId: string): number[] => {
    const seen = new Set<number>();
    const out: number[] = [];
    for (const t of list) {
      const v = t.lines[itemId]?.[field];
      if (v === null || v === undefined || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
      if (out.length >= 6) break;
    }
    return out;
  };
}

const toLines = (l: Record<string, TrackingLine>): Lines =>
  Object.fromEntries(Object.entries(l).map(([id, v]) => [id, { inv: v.inv === null ? undefined : v.inv, ord: v.ord }]));

// Handles both /track/new and /track/:id/edit.
export function TrackingContainer() {
  const nav = useNavigate();
  const { id } = useParams();
  const rid = useAppSelector((s) => s.restaurants.currentId);
  const by = useAppSelector((s) => s.auth.user?.name ?? 'You');
  const cats = useAppSelector((s) => s.catalog.categories);
  const items = useAppSelector((s) => s.catalog.items);
  const list = useAppSelector((s) => s.trackings.list);
  const existing = id ? list.find((t) => t.id === id) : undefined;

  const categories = useMemo(
    () =>
      [...cats]
        .sort((a, b) => a.order - b.order)
        .map((c) => ({
          id: c.id,
          label: c.label,
          items: items.filter((i) => i.category === c.id && !i.disabled).map((i) => ({ id: i.id, name: i.name, unit: i.unit })),
        }))
        .filter((c) => c.items.length),
    [cats, items],
  );

  if (!rid) return null;

  return (
    <Tracking
      mode={id ? 'edit' : 'new'}
      categories={categories}
      initialLines={existing ? toLines(existing.lines) : undefined}
      initialNote={existing?.note}
      initialDateMs={existing?.date}
      recentInv={makeRecent(list, 'inv')}
      recentOrd={makeRecent(list, 'ord')}
      onSave={async (out) => {
        if (id) {
          await fs.updateTracking(rid, id, out);
          nav(`/track/${id}`, { replace: true });
        } else {
          const newId = await fs.createTracking(rid, by, out);
          nav(`/track/${newId}`, { replace: true });
        }
      }}
      onCancel={() => nav(id ? `/track/${id}` : '/home', { replace: true })}
    />
  );
}
