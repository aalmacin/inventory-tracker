// scripts/set-role.mjs
// Sets a user's `role` custom claim (the value the app reads in AuthProvider to
// gate access and routing). Role is a Firebase Auth custom claim, not a Firestore
// field, so it can't be edited from the Firebase Console — this is the only path,
// and it's how you bootstrap the first admin (inviteMember can't create admins).
//
// Usage:
//   Production: gcloud auth application-default login   # one-time, sets up ADC
//               node scripts/set-role.mjs user@example.com admin
//   Emulator:   FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
//               node scripts/set-role.mjs user@example.com admin
//
// The user must sign out and back in for the new claim to take effect.
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [email, role = 'admin'] = process.argv.slice(2);
if (!email) {
  console.error('Usage: node scripts/set-role.mjs <email> [role]');
  process.exit(1);
}

const projectId = JSON.parse(
  readFileSync(new URL('../.firebaserc', import.meta.url)),
).projects.default;

initializeApp({ projectId });
const auth = getAuth();

const user = await auth.getUserByEmail(email);
// Preserve any existing claims (e.g. restaurantIds) and only swap the role.
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role });

console.log(`set role ${email} → ${role} (uid ${user.uid})`);
console.log('User must sign out and back in for the claim to take effect.');
