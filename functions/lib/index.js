"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockBannedEmail = void 0;
const identity_1 = require("firebase-functions/v2/identity");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
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
