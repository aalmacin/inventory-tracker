import type { UnitQty } from '../../lib/units';

export interface DeliveryCheck {
  ok: boolean;
  arrived?: UnitQty; // per-unit arrived count, recorded when the order didn't arrive in full
  note?: string;
}

export interface TrackingLine {
  inv?: UnitQty; // counted inventory, per unit
  ord?: UnitQty; // order placed, per unit
  dlv?: DeliveryCheck;
}

export interface Tracking {
  id: string;
  date: number; // epoch ms
  by: string;
  note: string;
  lines: Record<string, TrackingLine>; // keyed by item id
}
