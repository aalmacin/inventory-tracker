export type Unit = 'pieces' | 'packs' | 'boxes';

export interface Category {
  id: string;
  label: string;
  order: number;
}

export interface Item {
  id: string;
  name: string;
  category: string; // category id
  unit: Unit;
  disabled: boolean;
  order: number; // sort position within its category
}
