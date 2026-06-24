// Firestore for team/members — YOU implement these.
// members/{uid} is top-level. inviteMember calls the admin-only Cloud Function
// (it sets custom claims server-side); the rest write the members doc.
import { collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import type { AppDispatch } from '../../app/store';
import type { MemberInput } from '../../pages/Team';
import { app, db } from '../../lib/firebase';
import { membersReceived } from './membersSlice';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import type { Member } from './types';

const membersCol = collection(db, 'members');

const functions = getFunctions(app)
if (import.meta.env.DEV) connectFunctionsEmulator(functions, 'localhost', 5001);


// Subscribe to all members; returns unsubscribe.
export function subscribeMembers(dispatch: AppDispatch): () => void {
  return onSnapshot(membersCol, snap => {
    const members: Member[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Member, 'id'>) }));
    dispatch(membersReceived(members));
  })
}

const callInvite = httpsCallable<MemberInput, { uid: string }>(functions, 'inviteMember');

// calls the inviteMember Cloud Function (httpsCallable)
export const inviteMember = async (input: MemberInput): Promise<void> => {
  await callInvite(input)
}

export const updateMember = (id: string, input: MemberInput): Promise<void> =>
  updateDoc(doc(membersCol, id), { ...input });

export const removeMember = (id: string): Promise<void> => deleteDoc(doc(membersCol, id));

export const resendInvite = (id: string): Promise<void> => updateDoc(doc(membersCol, id), { status: 'pending' });
