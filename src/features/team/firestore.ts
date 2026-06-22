// Firestore for team/members — YOU implement these.
// members/{uid} is top-level. inviteMember calls the admin-only Cloud Function
// (it sets custom claims server-side); the rest write the members doc.
import type { AppDispatch } from '../../app/store';
import type { MemberInput } from '../../pages/Team';
// import { membersReceived } from './membersSlice';

const todo = (name: string): never => {
  throw new Error(`TODO: implement team.${name} with Firestore`);
};

// Subscribe to all members; returns unsubscribe.
export function subscribeMembers(dispatch: AppDispatch): () => void {
  // TODO: onSnapshot(collection(db, 'members')) -> dispatch(membersReceived(...))
  void dispatch;
  return () => {};
}

// calls the inviteMember Cloud Function (httpsCallable)
export const inviteMember = (input: MemberInput): Promise<void> => (void input, todo('inviteMember'));

export const updateMember = (id: string, input: MemberInput): Promise<void> =>
  (void id, void input, todo('updateMember'));

export const removeMember = (id: string): Promise<void> => (void id, todo('removeMember'));

export const resendInvite = (id: string): Promise<void> => (void id, todo('resendInvite'));
