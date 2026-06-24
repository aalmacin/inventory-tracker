// scripts/seed-auth.mjs
// Seeds the demo login accounts into the Auth emulator and stamps each with its
// { role, restaurantIds } custom claims. Every ACTIVE member gets a login, and
// each account's uid is set to its member doc id (mem-*) so members/{uid} lines
// up with the team list. Admin is a separate login (admins aren't members).
// Pending members (Tom, Lin) have no login — they're invited, not joined.
//
// All accounts use password "kitchen"; the emails/passwords match LoginContainer
// and the demo-account quick-fill in pages/Login.tsx.
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Point the Admin SDK at the Auth emulator — no real credentials needed.
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= 'localhost:9099';

const projectId = JSON.parse(
  readFileSync(new URL('../.firebaserc', import.meta.url)),
).projects.default;

initializeApp({ projectId });
const auth = getAuth();

const PASSWORD = 'kitchen';
const users = [
  { uid: 'usr-admin', email: 'admin@riverside.co',      name: 'Alex Rivera', role: 'admin',      restaurantIds: ['riverside', 'lakeshore'] },
  { uid: 'mem-maya',  email: 'manager@riverside.co',    name: 'Maya Chen',   role: 'manager',    restaurantIds: ['riverside', 'lakeshore'] },
  { uid: 'mem-diego', email: 'supervisor@riverside.co', name: 'Diego Park',  role: 'supervisor', restaurantIds: ['riverside'] },
  { uid: 'mem-sara',  email: 'sara@lakeshore.co',       name: 'Sara Okafor', role: 'supervisor', restaurantIds: ['lakeshore'] },
  { uid: 'mem-priya', email: 'priya@lakeshore.co',      name: 'Priya Nair',  role: 'manager',    restaurantIds: ['lakeshore'] },
];

for (const u of users) {
  // If this email already exists under a different uid (e.g. an older seed run
  // that used auto-generated ids), remove it so we can pin the member-id uid.
  const existing = await auth.getUserByEmail(u.email).catch(() => null);
  if (existing && existing.uid !== u.uid) {
    await auth.deleteUser(existing.uid);
  }
  await auth
    .getUser(u.uid)
    .catch(() => auth.createUser({ uid: u.uid, email: u.email, password: PASSWORD, displayName: u.name }));
  await auth.setCustomUserClaims(u.uid, { role: u.role, restaurantIds: u.restaurantIds });
  console.log('seeded auth', u.email, '→', u.role, `(uid ${u.uid})`);
}

console.log('done — Auth emulator seeded (5 accounts).');
