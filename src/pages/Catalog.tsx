// Catalog.tsx — admin catalog screen (categories + items). PRESENTATIONAL ONLY.
//
// THE SEAM: this component renders data passed in as props and calls the
// callbacks you provide. It holds view-only state (which cards are expanded,
// which sheet is open, form fields) — but it never imports Redux, hooks, or
// firebase. You write a container that:
//   - reads restaurants/{rid}/categories and /items from Redux (wired to
//     Firestore via onSnapshot), maps them into CategoryVM[] below, and
//   - implements the on* callbacks as Firestore writes (addDoc/updateDoc/
//     writeBatch/deleteDoc) dispatched through your slices.
// See guide step "Categories & Items" for the Firestore side.
import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { Button, Switch, SheetModal } from '../ui/primitives';

// ── view models the container must supply ────────────────────
export type Unit = 'pieces' | 'packs' | 'boxes';
const UNITS: Unit[] = ['pieces', 'packs', 'boxes'];

export interface ItemVM {
  id: string;
  name: string;
  unit: Unit;
  disabled: boolean;
}
export interface CategoryVM {
  id: string;
  label: string;
  items: ItemVM[];
}

export interface CatalogProps {
  restaurantName: string;
  categories: CategoryVM[];
  onAddCategory: (label: string) => void;
  onRenameCategory: (id: string, label: string) => void;
  onDeleteCategory: (id: string) => void;
  onMoveCategory: (id: string, dir: -1 | 1) => void;
  onAddItem: (input: { categoryId: string; name: string; unit: Unit }) => void;
  onUpdateItem: (
    id: string,
    patch: { name: string; category: string; unit: Unit; disabled: boolean },
  ) => void;
  onDeleteItem: (id: string) => void;
  onToggleItem: (id: string, active: boolean) => void;
}

// ── category add / edit sheet ────────────────────────────────
function CategorySheet({
  category, onSave, onClose,
}: {
  category: CategoryVM | null;
  onSave: (label: string) => void;
  onClose: () => void;
}) {
  const isEdit = !!category;
  const [name, setName] = useState(category ? category.label : '');
  const [touched, setTouched] = useState(false);
  const err = touched && !name.trim();
  const save = () => {
    setTouched(true);
    if (!name.trim()) return;
    onSave(name.trim());
    onClose();
  };
  return (
    <SheetModal onClose={onClose}>
      <div style={{ padding: '18px 20px 10px' }}>
        <div className="t-lg fw-7" style={{ marginBottom: 16 }}>
          {isEdit ? 'Rename category' : 'New category'}
        </div>
        <div className="field">
          <label className="label">Category name <span className="req">*</span></label>
          <input
            className={`input ${err ? 'input--invalid' : ''}`}
            value={name}
            autoFocus
            placeholder="e.g. Bubble Tea Items"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          {err && <div className="field-err"><Icon name="alert" size={13} /> Name is required.</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          <Button variant="primary" block onClick={save}>{isEdit ? 'Save' : 'Add category'}</Button>
        </div>
      </div>
    </SheetModal>
  );
}

// ── item add / edit sheet ────────────────────────────────────
function ItemSheet({
  item, categoryId, categories, onAdd, onUpdate, onDelete, onClose,
}: {
  item: ItemVM | null;
  categoryId: string;
  categories: CategoryVM[];
  onAdd: CatalogProps['onAddItem'];
  onUpdate: CatalogProps['onUpdateItem'];
  onDelete: CatalogProps['onDeleteItem'];
  onClose: () => void;
}) {
  const isEdit = !!item;
  const [name, setName] = useState(item ? item.name : '');
  const [category, setCategory] = useState(categoryId);
  const [unit, setUnit] = useState<Unit>(item ? item.unit : 'pieces');
  const [disabled, setDisabled] = useState(item ? item.disabled : false);
  const [touched, setTouched] = useState(false);
  const err = touched && !name.trim();

  const save = () => {
    setTouched(true);
    if (!name.trim()) return;
    if (isEdit && item) onUpdate(item.id, { name: name.trim(), category, unit, disabled });
    else onAdd({ categoryId: category, name: name.trim(), unit });
    onClose();
  };

  return (
    <SheetModal onClose={onClose}>
      <div style={{ padding: '18px 20px 10px' }}>
        <div className="t-lg fw-7" style={{ marginBottom: 16 }}>{isEdit ? 'Edit item' : 'New item'}</div>
        <div className="stack" style={{ gap: 13 }}>
          <div className="field">
            <label className="label">Item name <span className="req">*</span></label>
            <input
              className={`input ${err ? 'input--invalid' : ''}`}
              value={name}
              autoFocus
              placeholder="e.g. Sushi Rice"
              onChange={(e) => setName(e.target.value)}
            />
            {err && <div className="field-err"><Icon name="alert" size={13} /> Name is required.</div>}
          </div>
          <div className="field">
            <label className="label">Category</label>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Unit</label>
            <div className="seg" role="radiogroup" aria-label="Unit">
              {UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  role="radio"
                  aria-checked={unit === u}
                  className={`seg__opt ${unit === u ? 'seg__opt--active is-delivery' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                  onClick={() => setUnit(u)}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div className="toggle-row">
            <span style={{ color: disabled ? 'var(--ink-4)' : 'var(--accent-text)', display: 'flex' }}>
              <Icon name={disabled ? 'eyeOff' : 'eye'} size={20} />
            </span>
            <div className="toggle-row__body">
              <div className="toggle-row__title">Show in new trackings</div>
              <div className="toggle-row__sub">
                {disabled
                  ? 'Hidden — skipped when you start a new tracking. Past trackings keep their values.'
                  : 'Appears on every new tracking walk.'}
              </div>
            </div>
            <Switch on={!disabled} onChange={(v) => setDisabled(!v)} aria-label="show in new trackings" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && item ? (
            <Button
              variant="danger"
              onClick={() => { onDelete(item.id); onClose(); }}
              style={{ flex: '0 0 auto', paddingLeft: 16, paddingRight: 16 }}
              aria-label="delete item"
            >
              <Icon name="trash" size={17} />
            </Button>
          ) : (
            <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          )}
          <Button variant="primary" block onClick={save}>{isEdit ? 'Save item' : 'Add item'}</Button>
        </div>
      </div>
    </SheetModal>
  );
}

// ── one category card ────────────────────────────────────────
function CategoryCard({
  cat, idx, total, open, onToggle, onEdit, onDelete, onMove, onAddItem, onEditItem, onToggleItem,
}: {
  cat: CategoryVM;
  idx: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onAddItem: () => void;
  onEditItem: (item: ItemVM) => void;
  onToggleItem: (id: string, active: boolean) => void;
}) {
  const disabledN = cat.items.filter((i) => i.disabled).length;
  return (
    <div className="card card--flush">
      <div className="trk-cat" style={{ gap: 6 }}>
        <button
          onClick={onToggle}
          style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, textAlign: 'left' }}
        >
          <span style={{ color: 'var(--ink-3)', transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform .15s' }}>
            <Icon name="chevD" size={16} />
          </span>
          <span className="trk-cat__name">{cat.label}</span>
          <span className="trk-cat__count">
            {cat.items.length}
            {disabledN > 0 && <span className="muted-2" style={{ fontWeight: 500 }}> · {disabledN} off</span>}
          </span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button className="icon-btn" disabled={idx === 0} onClick={() => onMove(-1)} aria-label="move up" style={{ width: 30, height: 30, opacity: idx === 0 ? 0.3 : 1 }}><Icon name="arrowUp" size={16} /></button>
          <button className="icon-btn" disabled={idx === total - 1} onClick={() => onMove(1)} aria-label="move down" style={{ width: 30, height: 30, opacity: idx === total - 1 ? 0.3 : 1 }}><Icon name="arrowDown" size={16} /></button>
          <button className="icon-btn" onClick={onEdit} aria-label="rename" style={{ width: 30, height: 30 }}><Icon name="edit" size={16} /></button>
          <button className="icon-btn" onClick={onDelete} aria-label="delete" style={{ width: 30, height: 30, color: 'var(--out)' }}><Icon name="trash" size={16} /></button>
        </div>
      </div>
      {open && (
        <>
          {cat.items.length === 0 ? (
            <div style={{ padding: 14, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, borderTop: '1px solid var(--border)' }}>No items yet.</div>
          ) : cat.items.map((i) => (
            <div key={i.id} className={`row ${i.disabled ? 'row--disabled' : ''}`} style={{ borderTop: '1px solid var(--border)' }}>
              <button className="row__body" style={{ background: 'none', textAlign: 'left', padding: 0 }} onClick={() => onEditItem(i)}>
                <div className="row__title" style={{ fontSize: 14 }}>
                  <span className="item-name">{i.name}</span>
                  <span className="mono muted-2" style={{ fontSize: 11, textTransform: 'capitalize' }}>{i.unit}</span>
                  {i.disabled && <span className="badge badge--neutral">Hidden</span>}
                </div>
              </button>
              <Switch on={!i.disabled} onChange={(v) => onToggleItem(i.id, v)} aria-label={`show ${i.name} in new trackings`} />
            </div>
          ))}
          <button className="row" style={{ borderTop: '1px solid var(--border)', color: 'var(--accent-text)' }} onClick={onAddItem}>
            <span style={{ width: 20, display: 'flex', justifyContent: 'center' }}><Icon name="plus" size={17} /></span>
            <span className="fw-6 t-sm">Add item</span>
          </button>
        </>
      )}
    </div>
  );
}

// ── screen ───────────────────────────────────────────────────
export function Catalog(props: CatalogProps) {
  const { restaurantName, categories } = props;
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [catSheet, setCatSheet] = useState<{ category: CategoryVM | null } | null>(null);
  const [itemSheet, setItemSheet] = useState<{ item: ItemVM | null; categoryId: string } | null>(null);
  const [confirmCat, setConfirmCat] = useState<CategoryVM | null>(null);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });

  return (
    <div className="it-app screen">
      <div className="appbar">
        <div>
          <div className="appbar__title">Catalog</div>
          <div className="appbar__sub">{restaurantName}</div>
        </div>
      </div>

      <div className="scroll">
        <div className="pad stack" style={{ gap: 12 }}>
          <div className="t-sm muted" style={{ padding: '0 2px', lineHeight: 1.5 }}>
            Categories and items for <span className="fw-6" style={{ color: 'var(--ink)' }}>{restaurantName}</span>.
            Reorder them to set the order staff walk the stockroom. Switch restaurants from the top bar.
          </div>

          {categories.map((c, idx) => (
            <CategoryCard
              key={c.id}
              cat={c}
              idx={idx}
              total={categories.length}
              open={open.has(c.id)}
              onToggle={() => toggle(c.id)}
              onEdit={() => setCatSheet({ category: c })}
              onDelete={() => setConfirmCat(c)}
              onMove={(dir) => props.onMoveCategory(c.id, dir)}
              onAddItem={() => setItemSheet({ item: null, categoryId: c.id })}
              onEditItem={(i) => setItemSheet({ item: i, categoryId: c.id })}
              onToggleItem={props.onToggleItem}
            />
          ))}

          <Button variant="secondary" block icon="plus" onClick={() => setCatSheet({ category: null })}>
            Add category
          </Button>
          <div className="content-pad-bottom" />
        </div>
      </div>

      {catSheet && (
        <CategorySheet
          category={catSheet.category}
          onSave={(label) => {
            if (catSheet.category) props.onRenameCategory(catSheet.category.id, label);
            else props.onAddCategory(label);
          }}
          onClose={() => setCatSheet(null)}
        />
      )}

      {itemSheet && (
        <ItemSheet
          item={itemSheet.item}
          categoryId={itemSheet.categoryId}
          categories={categories}
          onAdd={props.onAddItem}
          onUpdate={props.onUpdateItem}
          onDelete={props.onDeleteItem}
          onClose={() => setItemSheet(null)}
        />
      )}

      {confirmCat && (
        <SheetModal onClose={() => setConfirmCat(null)}>
          <div style={{ padding: '20px 20px 8px' }}>
            <div className="t-lg fw-7">Delete “{confirmCat.label}”?</div>
            <div className="muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
              This removes the category and its {confirmCat.items.length} item{confirmCat.items.length === 1 ? '' : 's'} from your list.
              Past trackings keep their recorded values.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <Button variant="danger" size="lg" block icon="trash" onClick={() => { props.onDeleteCategory(confirmCat.id); setConfirmCat(null); }}>
                Delete category
              </Button>
              <Button variant="ghost" size="lg" block onClick={() => setConfirmCat(null)}>Cancel</Button>
            </div>
          </div>
        </SheetModal>
      )}
    </div>
  );
}
