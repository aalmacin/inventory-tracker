export interface DeliveryCheck {
  ok: boolean;
  arrived?: number;
  note?: string;
}

export interface TrackingLine {
  inv: number | null;
  ord: number | null;
  dlv?: DeliveryCheck;
}

export interface Tracking {
  id: string;
  date: number; // epoch ms
  by: string;
  note: string;
  lines: Record<string, TrackingLine>; // keyed by item id
}
