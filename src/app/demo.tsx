// demo.tsx — DEMO STORE for the runnable harness. NOT your real data layer.
// It holds everything in local React state so you can click through the app
// before wiring Firestore. Replace this whole file (and the route containers in
// App.tsx) with your Redux store + onSnapshot listeners + thunks.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Role = 'admin' | 'manager' | 'supervisor';
export type Unit = 'pieces' | 'packs' | 'boxes';
export interface Category { id: string; label: string; order: number; }
export interface Item { id: string; name: string; category: string; unit: Unit; disabled: boolean; }
export interface DeliveryCheck { ok: boolean; arrived?: number; note?: string; }
export interface TrackingLine { inv: number | null; ord: number | null; dlv?: DeliveryCheck; }
export interface Tracking { id: string; date: number; by: string; note: string; lines: Record<string, TrackingLine>; }
export interface Restaurant { id: string; name: string; city: string; initials: string; tint: string; }
export interface Member { id: string; name: string; email: string; role: 'manager' | 'supervisor'; status: 'active' | 'pending'; restaurantIds: string[]; }
export interface User { name: string; email: string; role: Role; restaurantIds: string[]; }

let _id = 0;
const uid = (p: string) => `${p}-${++_id}`;
const DAY = 86400000;

// ── seed ─────────────────────────────────────────────────────
const RESTAURANTS: Restaurant[] = [
  { id: 'riverside', name: 'Riverside Sushi & Boba', city: 'Portland, OR', initials: 'RS', tint: 'oklch(0.52 0.083 194)' },
  { id: 'lakeshore', name: 'Lakeshore Poké Bar', city: 'Seattle, WA', initials: 'LP', tint: 'oklch(0.55 0.12 256)' },
];

function seedCatalog(): Record<string, { categories: Category[]; items: Item[] }> {
  const mk = (names: [string, Unit][], cid: string): Item[] =>
    names.map(([name, unit]) => ({ id: uid('itm'), name, category: cid, unit, disabled: false }));
  const rCats: Category[] = [
    { id: 'bags', label: 'Bags & Containers', order: 0 },
    { id: 'grocery', label: 'Grocery', order: 1 },
    { id: 'drinks', label: 'Drinks', order: 2 },
  ];
  const rItems = [
    ...mk([['Sandwich Bag', 'boxes'], ['Bento Box', 'boxes'], ['Soup Bowl + Lid', 'boxes'], ['Chopsticks', 'packs']], 'bags'),
    ...mk([['Sushi Rice', 'packs'], ['Avocado', 'boxes'], ['Wasabi', 'pieces'], ['Seaweed', 'packs'], ['Soy Sauce', 'pieces']], 'grocery'),
    ...mk([['Coke', 'boxes'], ['Sprite', 'boxes'], ['Bottled Water', 'boxes']], 'drinks'),
  ];
  const lCats: Category[] = [
    { id: 'bases', label: 'Bases & Grains', order: 0 },
    { id: 'proteins', label: 'Proteins', order: 1 },
  ];
  const lItems = [
    ...mk([['White Rice', 'packs'], ['Quinoa', 'packs'], ['Mixed Greens', 'boxes']], 'bases'),
    ...mk([['Ahi Tuna', 'boxes'], ['Salmon', 'boxes'], ['Tofu', 'pieces']], 'proteins'),
  ];
  return {
    riverside: { categories: rCats, items: rItems },
    lakeshore: { categories: lCats, items: lItems },
  };
}

function seedTrackings(catalog: Record<string, { items: Item[] }>): Record<string, Tracking[]> {
  const build = (rid: string, daysAgo: number, by: string, note: string, withDelivery: boolean): Tracking => {
    const items = catalog[rid].items;
    const lines: Record<string, TrackingLine> = {};
    items.forEach((it, i) => {
      const inv = (i * 3 + 2) % 9;
      const ord = i % 3 === 0 ? (i % 4) + 1 : null;
      const line: TrackingLine = { inv, ord };
      if (withDelivery && ord !== null) {
        line.dlv = i % 5 === 0 ? { ok: false, arrived: Math.max(0, ord - 1), note: 'One case short — backorder' } : { ok: true };
      }
      lines[it.id] = line;
    });
    return { id: uid('trk'), date: Date.now() - daysAgo * DAY, by, note, lines };
  };
  return {
    riverside: [
      build('riverside', 1, 'Diego Park', 'Weekend prep', false),
      build('riverside', 5, 'Maya Chen', '', true),
      build('riverside', 9, 'Diego Park', 'Mid-week count', true),
    ],
    lakeshore: [build('lakeshore', 2, 'Sara Okafor', 'Lunch restock', true)],
  };
}

const MEMBERS: Member[] = [
  { id: 'mem-diego', name: 'Diego Park', email: 'supervisor@riverside.co', role: 'supervisor', status: 'active', restaurantIds: ['riverside'] },
  { id: 'mem-maya', name: 'Maya Chen', email: 'manager@riverside.co', role: 'manager', status: 'active', restaurantIds: ['riverside', 'lakeshore'] },
  { id: 'mem-tom', name: 'Tom Reyes', email: 'tom@riverside.co', role: 'supervisor', status: 'pending', restaurantIds: ['riverside'] },
];

const DEMO_USERS: Record<Role, User> = {
  admin: { name: 'Alex Rivera', email: 'admin@riverside.co', role: 'admin', restaurantIds: ['riverside', 'lakeshore'] },
  manager: { name: 'Maya Chen', email: 'manager@riverside.co', role: 'manager', restaurantIds: ['riverside', 'lakeshore'] },
  supervisor: { name: 'Diego Park', email: 'supervisor@riverside.co', role: 'supervisor', restaurantIds: ['riverside'] },
};

// ── store ────────────────────────────────────────────────────
interface DemoStore {
  user: User | null;
  restaurants: Restaurant[];
  currentId: string;
  categories: Category[];          // current restaurant
  items: Item[];                   // current restaurant
  trackings: Tracking[];           // current restaurant, newest-first
  members: Member[];
  myRestaurants: Restaurant[];
  signIn: (role: Role) => void;
  signOut: () => void;
  setCurrentRestaurant: (id: string) => void;
  // catalog
  addCategory: (label: string) => void;
  renameCategory: (id: string, label: string) => void;
  deleteCategory: (id: string) => void;
  moveCategory: (id: string, dir: -1 | 1) => void;
  addItem: (i: { categoryId: string; name: string; unit: Unit }) => void;
  updateItem: (id: string, p: { name: string; category: string; unit: Unit; disabled: boolean }) => void;
  deleteItem: (id: string) => void;
  setItemActive: (id: string, active: boolean) => void;
  // trackings
  addTracking: (t: { lines: Record<string, TrackingLine>; note: string; dateMs: number }) => string;
  updateTracking: (id: string, t: { lines: Record<string, TrackingLine>; note: string; dateMs: number }) => void;
  deleteTracking: (id: string) => void;
  setDelivery: (trackingId: string, itemId: string, dlv: DeliveryCheck | null) => void;
  trackingById: (id: string) => Tracking | undefined;
  restStats: (rid: string) => { itemCount: number; trackingCount: number; memberCount: number; lastTrackingMs: number | null };
  // restaurants / team
  addRestaurant: (i: { name: string; city: string }) => void;
  updateRestaurant: (id: string, i: { name: string; city: string }) => void;
  inviteMember: (i: { name: string; email: string; role: 'manager' | 'supervisor'; restaurantIds: string[] }) => void;
  updateMember: (id: string, i: { name: string; email: string; role: 'manager' | 'supervisor'; restaurantIds: string[] }) => void;
  removeMember: (id: string) => void;
  resendInvite: (id: string) => void;
}

const Ctx = createContext<DemoStore | null>(null);
export const useDemo = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDemo outside DemoProvider');
  return v;
};

export function DemoProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(RESTAURANTS);
  const [currentId, setCurrentId] = useState<string>('riverside');
  const [catalogs, setCatalogs] = useState(seedCatalog);
  const [trackingsByRest, setTrackingsByRest] = useState(() => seedTrackings(catalogs));
  const [members, setMembers] = useState<Member[]>(MEMBERS);

  const initialsOf = (name: string) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const patchCat = (fn: (c: { categories: Category[]; items: Item[] }) => { categories: Category[]; items: Item[] }) =>
    setCatalogs((prev) => ({ ...prev, [currentId]: fn(prev[currentId] ?? { categories: [], items: [] }) }));
  const patchTrk = (fn: (l: Tracking[]) => Tracking[]) =>
    setTrackingsByRest((prev) => ({ ...prev, [currentId]: fn(prev[currentId] ?? []) }));

  const cat = catalogs[currentId] ?? { categories: [], items: [] };
  const trackings = useMemo(
    () => [...(trackingsByRest[currentId] ?? [])].sort((a, b) => b.date - a.date),
    [trackingsByRest, currentId],
  );
  const myRestaurants = useMemo(
    () => (!user ? [] : user.role === 'admin' ? restaurants : restaurants.filter((r) => user.restaurantIds.includes(r.id))),
    [user, restaurants],
  );

  const store: DemoStore = {
    user, restaurants, currentId,
    categories: [...cat.categories].sort((a, b) => a.order - b.order),
    items: cat.items, trackings, members, myRestaurants,
    signIn: (role) => { const u = DEMO_USERS[role]; setUser(u); setCurrentId(role === 'admin' ? 'riverside' : u.restaurantIds[0]); },
    signOut: () => setUser(null),
    setCurrentRestaurant: setCurrentId,
    addCategory: (label) => patchCat((c) => ({ ...c, categories: [...c.categories, { id: uid('cat'), label, order: c.categories.length }] })),
    renameCategory: (id, label) => patchCat((c) => ({ ...c, categories: c.categories.map((x) => (x.id === id ? { ...x, label } : x)) })),
    deleteCategory: (id) => patchCat((c) => ({ categories: c.categories.filter((x) => x.id !== id), items: c.items.filter((i) => i.category !== id) })),
    moveCategory: (id, dir) => patchCat((c) => {
      const arr = [...c.categories].sort((a, b) => a.order - b.order);
      const i = arr.findIndex((x) => x.id === id); const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return c;
      const oi = arr[i].order; arr[i] = { ...arr[i], order: arr[j].order }; arr[j] = { ...arr[j], order: oi };
      return { ...c, categories: arr };
    }),
    addItem: (i) => patchCat((c) => ({ ...c, items: [...c.items, { id: uid('itm'), name: i.name, category: i.categoryId, unit: i.unit, disabled: false }] })),
    updateItem: (id, p) => patchCat((c) => ({ ...c, items: c.items.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
    deleteItem: (id) => patchCat((c) => ({ ...c, items: c.items.filter((x) => x.id !== id) })),
    setItemActive: (id, active) => patchCat((c) => ({ ...c, items: c.items.map((x) => (x.id === id ? { ...x, disabled: !active } : x)) })),
    addTracking: (t) => {
      const rec: Tracking = { id: uid('trk'), date: t.dateMs, by: user?.name ?? 'You', note: t.note, lines: t.lines };
      patchTrk((l) => [rec, ...l]); return rec.id;
    },
    updateTracking: (id, t) => patchTrk((l) => l.map((x) => (x.id === id ? { ...x, note: t.note, date: t.dateMs, lines: t.lines } : x))),
    deleteTracking: (id) => patchTrk((l) => l.filter((x) => x.id !== id)),
    setDelivery: (trackingId, itemId, dlv) => patchTrk((l) => l.map((t) => {
      if (t.id !== trackingId) return t;
      const lines = { ...t.lines }; const ln = { ...(lines[itemId] ?? { inv: null, ord: null }) };
      if (dlv === null) delete ln.dlv; else ln.dlv = dlv;
      lines[itemId] = ln; return { ...t, lines };
    })),
    trackingById: (id) => trackings.find((t) => t.id === id),
    restStats: (rid) => {
      const c = catalogs[rid] ?? { items: [] };
      const trks = trackingsByRest[rid] ?? [];
      return {
        itemCount: c.items.filter((i) => !i.disabled).length,
        trackingCount: trks.length,
        memberCount: members.filter((m) => m.status === 'active' && m.restaurantIds.includes(rid)).length,
        lastTrackingMs: trks.length ? Math.max(...trks.map((t) => t.date)) : null,
      };
    },
    addRestaurant: (i) => { const id = uid('rest'); setRestaurants((p) => [...p, { id, name: i.name, city: i.city, initials: initialsOf(i.name), tint: 'oklch(0.56 0.12 152)' }]); setCatalogs((p) => ({ ...p, [id]: { categories: [], items: [] } })); setTrackingsByRest((p) => ({ ...p, [id]: [] })); },
    updateRestaurant: (id, i) => setRestaurants((p) => p.map((r) => (r.id === id ? { ...r, name: i.name, city: i.city, initials: initialsOf(i.name) } : r))),
    inviteMember: (i) => setMembers((p) => [{ id: uid('mem'), name: i.name || i.email.split('@')[0], email: i.email, role: i.role, status: 'pending', restaurantIds: i.restaurantIds }, ...p]),
    updateMember: (id, i) => setMembers((p) => p.map((m) => (m.id === id ? { ...m, ...i, name: i.name || m.name } : m))),
    removeMember: (id) => setMembers((p) => p.filter((m) => m.id !== id)),
    resendInvite: () => { /* demo no-op */ },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
