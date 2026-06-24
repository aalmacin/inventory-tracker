// scripts/seed-firestore.mjs
// Seeds the Firestore emulator with the SAME demo data the design mockup uses:
// two restaurants, their full catalogs, the team members, and a set of dated
// trackings (generated deterministically, matching the design's data.jsx).
//
// Shapes written match the app's types:
//   restaurants/{rid}                    { name, city, initials, tint }
//   restaurants/{rid}/categories/{id}    { label, order }
//   restaurants/{rid}/items/{id}         { name, category, unit, disabled }
//   restaurants/{rid}/trackings/{id}     { date, by, note, lines }
//   members/{id}                         { name, email, role, status, restaurantIds }
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ??= 'localhost:8080';
const projectId = JSON.parse(
  readFileSync(new URL('../.firebaserc', import.meta.url)),
).projects.default;
initializeApp({ projectId });
const db = getFirestore();

// ── Restaurants ──────────────────────────────────────────────
const RESTAURANTS = [
  { id: 'riverside', name: 'Riverside Sushi & Boba', city: 'Portland, OR', initials: 'RS', tint: 'oklch(0.52 0.083 194)' },
  { id: 'lakeshore', name: 'Lakeshore Poké Bar',     city: 'Seattle, WA',  initials: 'LP', tint: 'oklch(0.55 0.12 256)' },
];

// ── Item unit normalization → app's Unit ('pieces' | 'packs' | 'boxes') ──
const ITEM_UNITS = ['pieces', 'packs', 'boxes'];
const normalizeUnit = (u) => {
  if (ITEM_UNITS.includes(u)) return u;
  const map = { ea: 'pieces', each: 'pieces', pack: 'packs', bag: 'packs', roll: 'packs', box: 'boxes', case: 'boxes', tray: 'boxes' };
  return map[u] || 'pieces';
};

// ════ Restaurant 1 — Riverside Sushi & Boba ════
const RIVERSIDE_CATS = [
  { id: 'bags',     label: 'Bags & Containers' },
  { id: 'grocery',  label: 'Grocery' },
  { id: 'others',   label: 'Others' },
  { id: 'drinks',   label: 'Drinks' },
  { id: 'protein',  label: 'Frozen/Protein' },
  { id: 'boba',     label: 'Bubble Tea Items' },
  { id: 'special',  label: 'Special Order' },
  { id: 'sauces',   label: 'Sauces/Condiments' },
  { id: 'cleaning', label: 'Cleaning Materials' },
];

// tuple: [name, unit]  (packSize from the design is not part of the app's Item type)
const RIVERSIDE_CATALOG = {
  bags: [
    ['Sandwich Bag', 'case'], ['Spring Roll Bag', 'case'], ['Small Bags', 'case'], ['Large Bags', 'case'],
    ['Bento Box', 'case'], ['Soup Bowl + Lid', 'case'], ['Sumo Container', 'case'], ['Regular 26oz', 'case'],
    ['Kids 16oz', 'case'], ['Teriyaki Cup 4oz', 'case'], ['Portion Cup 1.5oz', 'case'], ['Small Cup 12oz', 'case'],
    ['Medium Cup 20oz', 'case'], ['Bubble Tea Cup', 'case'], ['Regular Lid 26oz', 'case'], ['Kids Lid 16oz', 'case'],
    ['Teriyaki Lid 4oz', 'case'], ['Portion Lid 1.5oz', 'case'], ['Cup Lid (Drink)', 'case'], ['Sushi XL', 'case'],
    ['Sushi S', 'case'], ['Chopsticks', 'case'], ['Fork', 'case'], ['Soup Spoon', 'case'],
    ['Straw (Boba)', 'box'], ['Straw (Reg)', 'box'], ['Napkin', 'case'], ['Gloves', 'case'],
  ],
  grocery: [
    ['Brown Rice', 'bag'], ['White Rice', 'bag'], ['Sushi Rice', 'bag'], ['Cornstarch', 'box'],
    ['Avocado', 'case'], ['Broccoli', 'case'], ['Cabbage', 'case'], ['Kale', 'case'], ['Corn', 'case'],
    ['Cucumber', 'case'], ['Mushroom', 'case'], ['Red Pepper', 'case'], ['Pineapple', 'case'], ['Pink Ginger', 'case'],
    ['Wasabi', 'case'], ['Crispy Onion', 'bag'], ['Seaweed', 'case'], ['Sushi Vinegar', 'case'],
    ['Black Sesame', 'bag'], ['White Sesame', 'bag'], ['Table Salt', 'case'], ['Veg Soup Base', 'case'],
    ['Soup Base (Pork)', 'case'], ['Teriyaki Sauce', 'case'], ['Green Butter', 'case'], ['Oil', 'case'],
    ['Patty Paper', 'case'], ['Drink Tray', 'case'],
  ],
  others: [
    ['Freshness Sticker', 'roll'], ['Made Fresh Sticker', 'roll'], ["Kid's Pocky Choco", 'case'], ['Edo Teriyaki Bottle', 'case'],
  ],
  drinks: [
    ["Kid's Apple", 'case'], ['Simple Orange', 'case'], ['Coke', 'case'], ['Diet Coke', 'case'], ['Coke Zero', 'case'],
    ['Sprite', 'case'], ['Ginger Ale', 'case'], ['Root Beer', 'case'], ['Fanta', 'case'], ['Fuze Iced Tea', 'case'],
    ['Bottled Water', 'case'], ['Vit Water Multi-V', 'case'], ['Vit Water XXX', 'case'], ['Monster Green', 'case'],
    ['Monster White', 'case'], ['Coke BIB', 'box'], ['Diet Coke BIB', 'box'], ['Coke Zero BIB', 'box'],
    ['Sprite BIB', 'box'], ['Fuze Iced Tea BIB', 'box'], ['Root Beer BIB', 'box'], ['CO2 Order', 'tank'], ['CO2 Return', 'tank'],
  ],
  protein: [
    ['Beef', 'case'], ['Chicken', 'case'], ['White Shrimp', 'case'], ['Tempura Shrimp', 'case'], ['Tofu', 'case'],
    ['Tuna', 'case'], ['Crab Meat', 'case'], ['Cauli Rice', 'case'], ['Edamame Whole', 'case'], ['Gyoza', 'case'],
    ['Spring Roll', 'case'], ['Yam Tempura', 'case'], ['Ramen', 'case'], ['Yakisoba', 'case'],
  ],
  boba: [
    ['Jasmine Green Tea', 'case'], ['Assam Black Tea', 'case'], ['Tapioca Pearls', 'case'], ['Lychee Coco Jelly', 'case'],
    ['Creamer', 'case'], ['Brown Sugar Syrup', 'case'], ['Mango Syrup', 'btl'], ['Strawberry Jam', 'btl'],
    ['Taro Powder', 'bag'], ['Trehalose', 'bag'],
  ],
  special: [
    ['Pocky Almond', 'case'], ['Pocky Cookies & Cream', 'case'],
  ],
  sauces: [
    ['Unagi Sushi Sauce', 'case'], ['Chili Garlic', 'case'], ['Soy Sauce Can', 'case'], ['Soy Sauce Portion', 'case'],
    ['Gluten Free Soy Sauce', 'case'], ['Plum Sauce', 'case'], ['Gyoza Sauce', 'case'], ['Mayo', 'case'],
    ['Spicy Mayo', 'case'], ['Poke Dressing', 'case'], ['Salt Packets', 'case'], ['Pepper Packets', 'case'], ['Togarashi', 'case'],
  ],
  cleaning: [
    ['Brown Paper Towel', 'case'], ['Garbage Bag Black 25×60', 'case'], ['Garbage Bag 36×50', 'case'],
    ['Grill Bricks / Stones', 'case'], ['Wrap Clear Refill 17in', 'case'], ['Sanitizer', 'case'], ['Hand Soap', 'case'],
    ['Bar Detergent', 'case'], ['Dishwasher Detergent', 'case'], ['Floor Degreaser', 'case'],
  ],
};

// ════ Restaurant 2 — Lakeshore Poké Bar ════
const LAKESHORE_CATS = [
  { id: 'bases',     label: 'Bases & Grains' },
  { id: 'proteins',  label: 'Proteins' },
  { id: 'produce',   label: 'Produce & Toppings' },
  { id: 'sauces',    label: 'Sauces & Dressings' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'drinks',    label: 'Drinks' },
  { id: 'cleaning',  label: 'Cleaning Materials' },
];

const LAKESHORE_CATALOG = {
  bases: [
    ['White Rice', 'bag'], ['Brown Rice', 'bag'], ['Sushi Rice', 'bag'], ['Quinoa', 'bag'], ['Mixed Greens', 'case'], ['Zucchini Noodles', 'case'],
  ],
  proteins: [
    ['Ahi Tuna', 'case'], ['Salmon', 'case'], ['Spicy Tuna', 'case'], ['Cooked Shrimp', 'case'], ['Tofu', 'case'], ['Imitation Crab', 'case'], ['Chicken', 'case'],
  ],
  produce: [
    ['Avocado', 'case'], ['Edamame', 'case'], ['Cucumber', 'case'], ['Seaweed Salad', 'case'], ['Mango', 'case'],
    ['Green Onion', 'case'], ['Masago', 'tray'], ['Sesame Seeds', 'bag'], ['Crispy Onion', 'bag'],
  ],
  sauces: [
    ['Poke Shoyu', 'case'], ['Spicy Mayo', 'case'], ['Eel Sauce', 'case'], ['Ponzu', 'case'], ['Sriracha', 'case'], ['Sesame Dressing', 'case'],
  ],
  packaging: [
    ['Bowl 32oz', 'case'], ['Bowl Lid', 'case'], ['Fork', 'case'], ['Napkin', 'case'], ['Paper Bag', 'case'], ['Chopsticks', 'case'],
  ],
  drinks: [
    ['Bottled Water', 'case'], ['Coke', 'case'], ['Sprite', 'case'], ['Iced Tea', 'case'], ['Coconut Water', 'case'],
  ],
  cleaning: [
    ['Sanitizer', 'case'], ['Hand Soap', 'case'], ['Paper Towel', 'case'], ['Garbage Bag 36×50', 'case'], ['Gloves', 'case'],
  ],
};

// stable, restaurant-scoped item ids (trackings key their lines by these)
function buildItems(rid, cats, catalog) {
  const out = [];
  cats.forEach((cat) => {
    (catalog[cat.id] || []).forEach(([name, unit], i) => {
      out.push({ id: `itm-${rid}-${cat.id}-${i}`, name, category: cat.id, unit: normalizeUnit(unit), disabled: false });
    });
  });
  return out;
}

const ITEMS = {
  riverside: buildItems('riverside', RIVERSIDE_CATS, RIVERSIDE_CATALOG),
  lakeshore: buildItems('lakeshore', LAKESHORE_CATS, LAKESHORE_CATALOG),
};

// ── Trackings generator (ported from the design's data.jsx) ──
const pseudo = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const DAY = 1000 * 60 * 60 * 24;

const DLV_SHORT_NOTES = [
  'Short shipped — backorder Tuesday',
  'Two cases damaged in transit, refused',
  'Driver said rest is on the next truck',
  'Substituted, count is off',
  'One case leaking, sent back',
];
const DLV_QUALITY_NOTES = [
  'Looks good, well within date',
  'A little bruised but usable',
  'Packed cold, no issues',
  'Dates are tight — use first',
  '',
  '',
];

function buildTrackings(rid, itemList, defs, seedOffset) {
  return defs
    .map((def, s) => {
      const lines = {};
      itemList.forEach((it, idx) => {
        const inv = Math.round(pseudo(idx * 7.13 + (s + seedOffset) * 31.7) * 16); // 0..16
        const r = pseudo(idx * 5.21 + (s + seedOffset) * 13.3);
        const ord = r > 0.8 ? Math.round(pseudo(idx * 3.7 + (s + seedOffset) * 9.1) * 6) + 1 : null;
        const line = { inv, ord };
        // delivery validation only on past trackings (the most recent is awaiting delivery)
        if (ord != null && s >= 1) {
          const d = pseudo(idx * 2.9 + (s + seedOffset) * 4.7);
          if (d > 0.78) {
            const arrived = Math.max(0, ord - (1 + Math.round(pseudo(idx * 8.1 + s * 2.3) * (ord - 1))));
            line.dlv = { ok: false, arrived, note: DLV_SHORT_NOTES[Math.floor(pseudo(idx * 6.6 + s * 1.9) * DLV_SHORT_NOTES.length)] };
          } else if (d > 0.18) {
            const note = DLV_QUALITY_NOTES[Math.floor(pseudo(idx * 4.4 + s * 3.1) * DLV_QUALITY_NOTES.length)];
            line.dlv = { ok: true, note };
          }
        }
        lines[it.id] = line;
      });
      return { id: `trk-${rid}-${s}`, date: Date.now() - def.daysAgo * DAY, note: def.note, by: def.by, lines };
    })
    .sort((a, b) => b.date - a.date);
}

const RIVERSIDE_SESSIONS = [
  { daysAgo: 1,  note: 'Weekend prep',              by: 'Diego Park' },
  { daysAgo: 4,  note: '',                          by: 'Maya Chen' },
  { daysAgo: 7,  note: 'Slow week, light order',    by: 'Diego Park' },
  { daysAgo: 11, note: 'Restock after holiday rush', by: 'Diego Park' },
  { daysAgo: 15, note: 'Mid-month count',           by: 'Maya Chen' },
  { daysAgo: 18, note: '',                          by: 'Diego Park' },
  { daysAgo: 22, note: 'Supplier delivery Tuesday', by: 'Diego Park' },
  { daysAgo: 26, note: 'Pre-event stock-up',        by: 'Maya Chen' },
  { daysAgo: 29, note: '',                          by: 'Diego Park' },
  { daysAgo: 33, note: 'End of month reconcile',    by: 'Maya Chen' },
  { daysAgo: 37, note: 'Light week',                by: 'Diego Park' },
  { daysAgo: 41, note: 'Quarterly deep count',      by: 'Maya Chen' },
  { daysAgo: 45, note: '',                          by: 'Diego Park' },
];

const LAKESHORE_SESSIONS = [
  { daysAgo: 2,  note: 'Lunch rush restock',  by: 'Sara Okafor' },
  { daysAgo: 6,  note: '',                     by: 'Maya Chen' },
  { daysAgo: 9,  note: 'Fish delivery Thursday', by: 'Sara Okafor' },
  { daysAgo: 14, note: 'Mid-month count',      by: 'Sara Okafor' },
  { daysAgo: 20, note: 'Patio season ramp-up', by: 'Maya Chen' },
  { daysAgo: 27, note: '',                     by: 'Sara Okafor' },
];

const TRACKINGS = {
  riverside: buildTrackings('riverside', ITEMS.riverside, RIVERSIDE_SESSIONS, 0),
  lakeshore: buildTrackings('lakeshore', ITEMS.lakeshore, LAKESHORE_SESSIONS, 17),
};

// ── Members (team list) ──────────────────────────────────────
const MEMBERS = [
  { id: 'mem-maya',  name: 'Maya Chen',   email: 'manager@riverside.co',    role: 'manager',    restaurantIds: ['riverside', 'lakeshore'], status: 'active' },
  { id: 'mem-diego', name: 'Diego Park',  email: 'supervisor@riverside.co', role: 'supervisor', restaurantIds: ['riverside'],              status: 'active' },
  { id: 'mem-sara',  name: 'Sara Okafor', email: 'sara@lakeshore.co',       role: 'supervisor', restaurantIds: ['lakeshore'],              status: 'active' },
  { id: 'mem-priya', name: 'Priya Nair',  email: 'priya@lakeshore.co',      role: 'manager',    restaurantIds: ['lakeshore'],              status: 'active' },
  { id: 'mem-tom',   name: 'Tom Reyes',   email: 'tom@riverside.co',        role: 'supervisor', restaurantIds: ['riverside'],              status: 'pending' },
  { id: 'mem-lin',   name: 'Lin Zhao',    email: 'lin@lakeshore.co',        role: 'supervisor', restaurantIds: ['lakeshore'],              status: 'pending' },
];

// ── Collect every write, then commit in chunks (Firestore caps a batch at 500) ──
const writes = [];
const push = (path, data) => writes.push({ ref: db.doc(path), data });

for (const { id, ...data } of RESTAURANTS) push(`restaurants/${id}`, data);

for (const rid of Object.keys(ITEMS)) {
  const cats = rid === 'riverside' ? RIVERSIDE_CATS : LAKESHORE_CATS;
  cats.forEach((cat, order) => push(`restaurants/${rid}/categories/${cat.id}`, { label: cat.label, order }));
  for (const { id, ...data } of ITEMS[rid]) push(`restaurants/${rid}/items/${id}`, data);
  for (const { id, ...data } of TRACKINGS[rid]) push(`restaurants/${rid}/trackings/${id}`, data);
}

for (const { id, ...data } of MEMBERS) push(`members/${id}`, data);

for (let i = 0; i < writes.length; i += 400) {
  const batch = db.batch();
  for (const w of writes.slice(i, i + 400)) batch.set(w.ref, w.data);
  await batch.commit();
}

console.log(`done — seeded ${writes.length} Firestore documents`);
console.log(`  restaurants: ${RESTAURANTS.length}`);
console.log(`  riverside: ${ITEMS.riverside.length} items, ${TRACKINGS.riverside.length} trackings`);
console.log(`  lakeshore: ${ITEMS.lakeshore.length} items, ${TRACKINGS.lakeshore.length} trackings`);
console.log(`  members: ${MEMBERS.length}`);
