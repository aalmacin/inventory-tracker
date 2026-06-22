import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Reports } from '../../pages/Reports';
import { AppHeader } from '../../ui/shell';
import { useAppSelector } from '../../lib/hooks';
import { useChrome } from '../../app/useChrome';

export function ReportsContainer() {
  const nav = useNavigate();
  const chrome = useChrome();
  const cats = useAppSelector((s) => s.catalog.categories);
  const items = useAppSelector((s) => s.catalog.items);
  const list = useAppSelector((s) => s.trackings.list);

  const categories = useMemo(
    () =>
      cats.map((c) => ({
        id: c.id,
        label: c.label,
        items: items.filter((i) => i.category === c.id && !i.disabled).map((i) => ({ id: i.id, name: i.name })),
      })),
    [cats, items],
  );
  const trackings = useMemo(() => list.map((t) => ({ id: t.id, dateMs: t.date, lines: t.lines })), [list]);

  return (
    <Reports
      header={<AppHeader title="Reports" sub="Stockroom" switcher={chrome.switcher} account={chrome.account} />}
      categories={categories}
      trackings={trackings}
      onOpenTracking={(id) => nav(`/track/${id}`)}
    />
  );
}
