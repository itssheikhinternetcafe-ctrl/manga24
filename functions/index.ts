import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

initializeApp();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const blockBannedEmail = beforeUserCreated(async (event) => {
  const email = event.data?.email;
  if (!email) return;
  const banned = await getFirestore().doc(`bannedEmails/${normalizeEmail(email)}`).get();
  if (banned.exists) throw new Error('This email address is not eligible to register.');
});

type WriteAction = 'comment' | 'communityPost' | 'report' | 'series';
const limits: Record<WriteAction, { max: number; windowMs: number }> = {
  comment: { max: 8, windowMs: 10 * 60 * 1000 },
  communityPost: { max: 3, windowMs: 30 * 60 * 1000 },
  report: { max: 5, windowMs: 60 * 60 * 1000 },
  series: { max: 3, windowMs: 60 * 60 * 1000 },
};
const turnstileSecret = defineSecret('TURNSTILE_SECRET_KEY');

function requestKey(request: any): string {
  if (request.auth?.uid) return `user:${request.auth.uid}`;
  const forwarded = request.rawRequest?.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim();
  return `ip:${ip || 'unknown'}`;
}

async function enforceRateLimit(request: any, action: WriteAction) {
  const config = limits[action];
  const key = requestKey(request).replace(/[^a-zA-Z0-9:_-]/g, '_');
  const ref = getFirestore().doc(`rateLimits/${action}_${key}`);
  const now = Date.now();
  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.exists ? snapshot.data() || {} : {};
    const resetAt = Number(current.resetAt || 0);
    const count = resetAt > now ? Number(current.count || 0) : 0;
    if (count >= config.max) throw new HttpsError('resource-exhausted', 'Too many requests. Please try again later.');
    transaction.set(ref, { count: count + 1, resetAt: resetAt > now ? resetAt : now + config.windowMs, updatedAt: FieldValue.serverTimestamp() });
  });
}

export const protectedWrite = onCall({
  enforceAppCheck: true,
  secrets: [turnstileSecret],
  cors: ['https://manhwa24.xyz', 'http://127.0.0.1:3003', 'http://localhost:3003'],
}, async (request) => {
  const { action, data, turnstileToken } = request.data || {};
  if (!limits[action as WriteAction] || !data || typeof data !== 'object') throw new HttpsError('invalid-argument', 'Invalid write request.');
  if (action !== 'report' && !request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in is required.');
  if (action === 'series' && request.auth?.token.admin !== true) {
    const profile = await getFirestore().doc(`users/${request.auth!.uid}`).get();
    if (!['creator', 'admin'].includes(request.auth?.token.role as string) && profile.data()?.role !== 'creator') {
      throw new HttpsError('permission-denied', 'Creator access is required.');
    }
  }
  if (turnstileSecret.value()) {
    if (typeof turnstileToken !== 'string' || !turnstileToken) throw new HttpsError('failed-precondition', 'CAPTCHA verification is required.');
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: turnstileSecret.value(), response: turnstileToken, remoteip: request.rawRequest?.ip }),
    });
    const verification = await result.json() as { success?: boolean };
    if (!verification.success) throw new HttpsError('permission-denied', 'CAPTCHA verification failed.');
  }
  await enforceRateLimit(request, action as WriteAction);
  const store = getFirestore();
  const id = typeof data.id === 'string' && data.id ? data.id : `${action}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const collection = action === 'communityPost' ? 'posts' : `${action}s`;
  const payload = { ...data, id, authorId: request.auth?.uid || data.reporterId || 'guest', createdAt: data.createdAt || new Date().toISOString() };
  await store.collection(collection).doc(id).set(payload);
  return payload;
});
