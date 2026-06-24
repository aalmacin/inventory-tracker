// scripts/migrate-item-order.mjs
// One-time backfill: assigns a sequential `order` (0..n) to every item within
// each category, for every restaurant. Run once after deploying the item-ordering
// feature so existing items (written before `order` existed) sort and reorder
// reliably. Items already carrying an `order` keep their relative position.
//
// Emulator:   node scripts/migrate-item-order.mjs
// Production:  GOOGLE_APPLICATION_CREDENTIALS=<service-account.json> \
//              FIRESTORE_EMULATOR_HOST= node scripts/migrate-item-order.mjs
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ??= 'localhost:8080';
const projectId = JSON.parse(
  readFileSync(new URL('../.firebaserc', import.meta.url)),
).projects.default;
initializeApp({ projectId });
const db = getFirestore();

const restaurants = await db.collection('restaurants').get();

const writes = [];
for (const r of restaurants.docs) {
  const itemsSnap = await r.ref.collection('items').get();

  // group items by category, preserving each item's current order when present
  const byCategory = new Map();
  for (const d of itemsSnap.docs) {
    const data = d.data();
    if (!byCategory.has(data.category)) byCategory.set(data.category, []);
    byCategory.get(data.category).push({ ref: d.ref, order: data.order });
  }

  for (const group of byCategory.values()) {
    // stable: keep existing order; items without one (NaN) sink to the end
    group.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    group.forEach((item, i) => {
      if (item.order !== i) writes.push({ ref: item.ref, order: i });
    });
  }
}

for (let i = 0; i < writes.length; i += 400) {
  const batch = db.batch();
  for (const w of writes.slice(i, i + 400)) batch.update(w.ref, { order: w.order });
  await batch.commit();
}

console.log(`done — normalized order on ${writes.length} item(s) across ${restaurants.size} restaurant(s)`);
