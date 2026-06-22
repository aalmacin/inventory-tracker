import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase-admin/auth'

initializeApp({projectId: 'inventory-tracker'})
const auth = getAuth()

const accounts = [
  { email: 'admin@raidrin.com',      role: 'admin',      restaurantIds: ['riverside', 'lakeshore'] },
  { email: 'manager@raidrin.com',    role: 'manager',    restaurantIds: ['riverside', 'lakeshore'] },
  { email: 'supervisor@raidrin.com', role: 'supervisor', restaurantIds: ['riverside'] },
];

for (const a of accounts) {
  const user = await auth.getUserByEmail(a.email).catch(() =>
    auth.createUser({ email: a.email, password: 'kitchen', displayName: a.email.split('@')[0] }),
  );
  await auth.setCustomUserClaims(user.uid, { role: a.role, restaurantIds: a.restaurantIds });
  console.log('seeded', a.email, '→', a.role);
}