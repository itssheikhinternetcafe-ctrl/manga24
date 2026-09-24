"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedWrite = exports.blockBannedEmail = void 0;
const identity_1 = require("firebase-functions/v2/identity");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
(0, app_1.initializeApp)();
const normalizeEmail = (email) => email.trim().toLowerCase();
exports.blockBannedEmail = (0, identity_1.beforeUserCreated)(async (event) => {
    const email = event.data?.email;
    if (!email)
        return;
    const banned = await (0, firestore_1.getFirestore)().doc(`bannedEmails/${normalizeEmail(email)}`).get();
    if (banned.exists)
        throw new Error('This email address is not eligible to register.');
});
const limits = {
    comment: { max: 8, windowMs: 10 * 60 * 1000 },
    communityPost: { max: 3, windowMs: 30 * 60 * 1000 },
    report: { max: 5, windowMs: 60 * 60 * 1000 },
    series: { max: 3, windowMs: 60 * 60 * 1000 },
};
const turnstileSecret = (0, params_1.defineSecret)('TURNSTILE_SECRET_KEY');
function requestKey(request) {
    if (request.auth?.uid)
        return `user:${request.auth.uid}`;
    const forwarded = request.rawRequest?.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim();
    return `ip:${ip || 'unknown'}`;
}
async function enforceRateLimit(request, action) {
    const config = limits[action];
    const key = requestKey(request).replace(/[^a-zA-Z0-9:_-]/g, '_');
    const ref = (0, firestore_1.getFirestore)().doc(`rateLimits/${action}_${key}`);
    const now = Date.now();
    await (0, firestore_1.getFirestore)().runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists ? snapshot.data() || {} : {};
        const resetAt = Number(current.resetAt || 0);
        const count = resetAt > now ? Number(current.count || 0) : 0;
        if (count >= config.max)
            throw new https_1.HttpsError('resource-exhausted', 'Too many requests. Please try again later.');
        transaction.set(ref, { count: count + 1, resetAt: resetAt > now ? resetAt : now + config.windowMs, updatedAt: firestore_1.FieldValue.serverTimestamp() });
    });
}
exports.protectedWrite = (0, https_1.onCall)({ enforceAppCheck: true, secrets: [turnstileSecret] }, async (request) => {
    const { action, data, turnstileToken } = request.data || {};
    if (!limits[action] || !data || typeof data !== 'object')
        throw new https_1.HttpsError('invalid-argument', 'Invalid write request.');
    if (action !== 'report' && !request.auth?.uid)
        throw new https_1.HttpsError('unauthenticated', 'Sign in is required.');
    if (action === 'series' && request.auth?.token.admin !== true) {
        const profile = await (0, firestore_1.getFirestore)().doc(`users/${request.auth.uid}`).get();
        if (!['creator', 'admin'].includes(request.auth?.token.role) && profile.data()?.role !== 'creator') {
            throw new https_1.HttpsError('permission-denied', 'Creator access is required.');
        }
    }
    if (turnstileSecret.value()) {
        if (typeof turnstileToken !== 'string' || !turnstileToken)
            throw new https_1.HttpsError('failed-precondition', 'CAPTCHA verification is required.');
        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ secret: turnstileSecret.value(), response: turnstileToken, remoteip: request.rawRequest?.ip }),
        });
        const verification = await result.json();
        if (!verification.success)
            throw new https_1.HttpsError('permission-denied', 'CAPTCHA verification failed.');
    }
    await enforceRateLimit(request, action);
    const store = (0, firestore_1.getFirestore)();
    const id = typeof data.id === 'string' && data.id ? data.id : `${action}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const collection = action === 'communityPost' ? 'posts' : `${action}s`;
    const payload = { ...data, id, authorId: request.auth?.uid || data.reporterId || 'guest', createdAt: data.createdAt || new Date().toISOString() };
    await store.collection(collection).doc(id).set(payload);
    return payload;
});
