// Units now live on the inventory/order/delivery, not the item. A single item
// (e.g. ketchup) can be counted across several units at once — 3 boxes, 2 packs,
// 11 pieces — and ordered in any mix of units. Units are independent labels with
// no conversion between them; this module is the single source of truth for the
// unit set and how a breakdown is displayed.
import { formatQty } from './quantity';

export type Unit = 'boxes' | 'packs';
export const UNITS: readonly Unit[] = ['boxes', 'packs'];

// A per-unit quantity. Only one unit is active at a time (boxes XOR packs).
export type UnitQty = Partial<Record<Unit, number>>;

export const UNIT_DISPLAY_ORDER: readonly Unit[] = ['boxes', 'packs'];

export const UNIT_ABBR: Record<Unit, string> = { boxes: 'B', packs: 'P' };
export const UNIT_LABEL: Record<Unit, string> = { boxes: 'boxes', packs: 'packs' };
export const UNIT_SINGULAR: Record<Unit, string> = { boxes: 'box', packs: 'pack' };

// True when the breakdown records at least one unit.
export const hasQty = (q: UnitQty | null | undefined): q is UnitQty =>
  !!q && UNITS.some((u) => q[u] != null);

// Units present in a breakdown, largest-first.
export const presentUnits = (q: UnitQty | null | undefined): Unit[] =>
  UNIT_DISPLAY_ORDER.filter((u) => q?.[u] != null);

// [{ unit, value }] largest-first — for compact per-unit rendering.
export const qtyEntries = (q: UnitQty | null | undefined): { unit: Unit; value: number }[] =>
  presentUnits(q).map((u) => ({ unit: u, value: q![u]! }));

// "2 boxes, 1 pack" — for copy/order text and delivery summaries.
export const formatUnitQtyLong = (q: UnitQty | null | undefined): string =>
  qtyEntries(q)
    .map(({ unit, value }) => `${formatQty(value)} ${value === 1 ? UNIT_SINGULAR[unit] : UNIT_LABEL[unit]}`)
    .join(', ');

// Stable key for de-duping recent breakdowns.
export const qtyKey = (q: UnitQty): string =>
  UNIT_DISPLAY_ORDER.map((u) => (q[u] != null ? `${u}:${q[u]}` : '')).join('|');
