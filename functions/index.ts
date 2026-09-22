import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const blockBannedEmail = beforeUserCreated(async (event) => {
  const email = event.data?.email;
  if (!email) return;
  const banned = await getFirestore().doc(`bannedEmails/${normalizeEmail(email)}`).get();
  if (banned.exists) throw new Error('This email address is not eligible to register.');
});
