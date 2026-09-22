import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!email || !password || !serviceAccountJson) {
  throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD, and FIREBASE_SERVICE_ACCOUNT_JSON are required.');
}

const app = getApps()[0] || initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
const auth = getAuth(app);
const firestore = getFirestore(app);

let account;
try {
  account = await auth.getUserByEmail(email);
} catch (error) {
  if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
  account = await auth.createUser({ email, password, emailVerified: true, disabled: false });
}

const existingClaims = (await auth.getUser(account.uid)).customClaims || {};
await auth.setCustomUserClaims(account.uid, { ...existingClaims, admin: true });
await firestore.collection('users').doc(account.uid).set({
  id: account.uid,
  email,
  emailNormalized: email,
  username: 'Manhwa24 Admin',
  role: 'admin',
  creatorStatus: 'active',
  joinedDate: new Date().toISOString(),
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true });

console.log(`Admin account provisioned: ${email}`);
