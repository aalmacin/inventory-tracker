// Items.tsx — read-only catalog browser for managers / supervisors.
// PRESENTATIONAL ONLY. They record trackings against this list but don't edit
// it (admins manage it in Catalog).
//
// THE SEAM: pass the current restaurant's name + active items grouped by
// category. Your container reads restaurants/{rid}/categories + /items from
// Redux (Firestore) and maps them into ItemsCategoryVM[].
import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { Button, Empty } from '../ui/primitives';

export interface ItemsCategoryVM {
  id: string;
  label: string;
  items: { id: string; name: string }[];   // active items only
}

export function Items({
  restaurantName,
  categories,
}: {
  restaurantName: string;
  categories: ItemsCategoryVM[];
}) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const q = query.trim().toLowerCase();

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const cats = categories.filter((c) => c.items.length);
  const activeN = categories.reduce((s, c) => s + c.items.length, 0);
  const noMatches = q && cats.every((c) => c.items.every((i) => !i.name.toLowerCase().includes(q)));

  return (
    <div className="it-app screen">
      <div className="appbar">
        <div className="appbar__title">Items</div>
      </div>

      <div className="scroll">
        <div className="pad stack" style={{ gap: 12 }}>
          <label className="search">
            <span style={{ color: 'var(--ink-3)', display: 'flex' }}><Icon name="search" size={18} /></span>
            <input value={query} placeholder="Search items" onChange={(e) => setQuery(e.target.value)} />
            {query && (
              <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => setQuery('')} aria-label="clear search">
                <Icon name="x" size={15} />
              </button>
            )}
          </label>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
            <span className="eyebrow">{restaurantName}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{activeN} items</span>
          </div>

          {noMatches && (
            <div className="card">
              <Empty icon="search" title="No items found" body={`Nothing matches “${query}”.`}
                action={<Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>} />
            </div>
          )}

          {cats.map((c) => {
            const visItems = q ? c.items.filter((i) => i.name.toLowerCase().includes(q)) : c.items;
            if (q && visItems.length === 0) return null;
            const isCol = q ? false : collapsed.has(c.id);
            return (
              <div key={c.id} className="card card--flush">
                <button className="trk-cat" onClick={() => toggle(c.id)}>
                  <span style={{ color: 'var(--ink-3)', transform: isCol ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}>
                    <Icon name="chevD" size={16} />
                  </span>
                  <span className="trk-cat__name">{c.label}</span>
                  <span className="trk-cat__count">{visItems.length}</span>
                </button>
                {!isCol && visItems.map((i) => (
                  <div key={i.id} className="row" style={{ borderTop: '1px solid var(--border)', cursor: 'default' }}>
                    <div className="row__body">
                      <div className="row__title" style={{ fontSize: 14 }}>{i.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="card card--pad" style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'var(--surface-2)' }}>
            <span style={{ color: 'var(--ink-3)', display: 'flex' }}><Icon name="shield" size={18} /></span>
            <div className="t-sm muted" style={{ lineHeight: 1.45 }}>
              This list is managed by your admin. To add or change items, ask them to update the catalog.
            </div>
          </div>

          <div className="content-pad-bottom" />
        </div>
      </div>
    </div>
  );
}
