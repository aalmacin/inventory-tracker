import { initializeApp } from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp()

interface InviteInput {
    name: string;
    email: string;
    role: 'manager' | 'supervisor';
    restaurantIds: string[];
}

export const inviteMember = onCall<InviteInput>(async (req) => {
    if (req.auth?.token.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Admins only');
    }

    const { name, email, role, restaurantIds } = req.data;

    const auth = getAuth();
    const user = await auth.getUserByEmail(email).catch(() => auth.createUser({ email, displayName: name }));

    await auth.setCustomUserClaims(user.uid, { role, restaurantIds });
    await getFirestore().doc(`members/${user.uid}`).set({ name, email, role, restaurantIds, status: 'pending' });

    return { uid: user.uid }
})