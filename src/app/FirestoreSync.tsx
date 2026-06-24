import { useFirestoreSync } from './useFirestoreSync';

// Mounts the Firestore listeners for the whole signed-in session. Lives above the
// router (not inside Layout) so screens outside the shell — notably the /select
// picker — also get the restaurants list. Renders nothing.
export function FirestoreSync() {
  useFirestoreSync();
  return null;
}
