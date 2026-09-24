/**
 * Manga24 - Firebase SDK Configuration & Initialization
 * 
 * ==============================================================================
 * SETUP INSTRUCTIONS:
 * ==============================================================================
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Enable "Authentication" -> Sign-in methods -> Enable "Email/Password" and "Google".
 * 3. Enable "Cloud Firestore" (Start in production mode or test mode).
 * 4. Configure Cloudinary for image uploads using VITE_CLOUDINARY_CLOUD_NAME and
 *    VITE_CLOUDINARY_UPLOAD_PRESET. Firebase Storage is not used for uploads.
 * 5. Go to Project Settings -> General -> "Your apps" -> Click the Web icon (</>).
 * 6. Copy your Firebase configuration credentials and EITHER:
 *    a) Paste them in your environment variables (.env file):
 *       VITE_FIREBASE_API_KEY=AIzaSy...
 *       VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
 *       VITE_FIREBASE_PROJECT_ID=your-app
 *       VITE_FIREBASE_STORAGE_BUCKET=your-app.firebasestorage.app
 *       VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
 *       VITE_FIREBASE_APP_ID=1:123456789:web:...
 * 
 *    OR
 *    b) Directly replace the placeholder values in the `firebaseConfig` object below.
 * ==============================================================================
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFunctions, httpsCallable, Functions } from 'firebase/functions';

const cleanFirebaseEnvValue = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const hasMatchingQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return hasMatchingQuotes ? trimmed.slice(1, -1).trim() || undefined : trimmed;
};

const firebaseEnv = {
  VITE_FIREBASE_API_KEY: cleanFirebaseEnvValue(import.meta.env.VITE_FIREBASE_API_KEY),
  VITE_FIREBASE_AUTH_DOMAIN: cleanFirebaseEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  VITE_FIREBASE_PROJECT_ID: cleanFirebaseEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  VITE_FIREBASE_STORAGE_BUCKET: cleanFirebaseEnvValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  VITE_FIREBASE_MESSAGING_SENDER_ID: cleanFirebaseEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  VITE_FIREBASE_APP_ID: cleanFirebaseEnvValue(import.meta.env.VITE_FIREBASE_APP_ID),
  VITE_FIREBASE_APPCHECK_SITE_KEY: cleanFirebaseEnvValue(import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY),
  VITE_RECAPTCHA_SITE_KEY: cleanFirebaseEnvValue(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
};

// PASTE YOUR FIREBASE CONFIG CREDENTIALS HERE OR USE VITE_ ENVIRONMENT VARIABLES:
const firebaseConfig = {
  apiKey: firebaseEnv.VITE_FIREBASE_API_KEY || 'AIzaSy_YOUR_FIREBASE_API_KEY_HERE',
  authDomain: firebaseEnv.VITE_FIREBASE_AUTH_DOMAIN || 'manga24-demo.firebaseapp.com',
  projectId: firebaseEnv.VITE_FIREBASE_PROJECT_ID || 'manga24-demo',
  storageBucket: firebaseEnv.VITE_FIREBASE_STORAGE_BUCKET || 'manga24-demo.firebasestorage.app',
  messagingSenderId: firebaseEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: firebaseEnv.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

/**
 * Checks if the user has replaced placeholder credentials with valid Firebase keys.
 */
export function getFirebaseConfigProblems(): string[] {
  const placeholders = [
      'YOUR_FIREBASE_API_KEY',
      'AIzaSy...',
      'manga24-demo',
      'your-project',
      '1234567890',
      'abcdef123456',
  ];

  return Object.entries(firebaseEnv)
    .filter(([, value]) => !value || placeholders.some((placeholder) => value.includes(placeholder)))
    .map(([name]) => name);
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfigProblems().length === 0;
}

export function getFirebaseConfigError(): string {
  const problems = getFirebaseConfigProblems();
  return problems.length > 0
    ? `Firebase is not configured. Missing or empty variable(s): ${problems.join(', ')}`
    : 'Firebase Authentication could not be initialized. Check the Firebase settings and try again.';
}

// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;

export function initFirebase() {
  if (isFirebaseConfigured() && !app) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      functions = getFunctions(app);
      const appCheckSiteKey = firebaseEnv.VITE_FIREBASE_APPCHECK_SITE_KEY || firebaseEnv.VITE_RECAPTCHA_SITE_KEY;
      if (appCheckSiteKey && typeof window !== 'undefined') {
        const provider = firebaseEnv.VITE_FIREBASE_APPCHECK_SITE_KEY
          ? new ReCaptchaEnterpriseProvider(appCheckSiteKey)
          : new ReCaptchaV3Provider(appCheckSiteKey);
        initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
      }
      try {
        // ignoreUndefinedProperties: Firestore rejects `undefined` values, this prevents silent save failures
        db = initializeFirestore(app, { ignoreUndefinedProperties: true });
      } catch {
        db = getFirestore(app);
      }
    } catch (error) {
      console.warn('[Firebase] Initialization deferred or fallback active:', error);
    }
  }
}

initFirebase();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, db, functions, firebaseConfig };

export function getProtectedWrite() {
  if (!functions) throw new Error('Firebase Functions are not configured.');
  return httpsCallable(functions, 'protectedWrite');
}

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1200;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const cleanCloudinaryEnvValue = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  return quoted ? trimmed.slice(1, -1).trim() || undefined : trimmed;
};

function getCloudinaryConfig(): { cloudName: string; uploadPreset: string } {
  const cloudName = cleanCloudinaryEnvValue(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
  const uploadPreset = cleanCloudinaryEnvValue(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  if (!cloudName || !uploadPreset) {
    throw new Error('Image upload is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in Vercel.');
  }
  return { cloudName, uploadPreset };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The selected image could not be read.'));
    };
    image.src = objectUrl;
  });
}

function convertToWebp(file: File): Promise<Blob> {
  return loadImage(file).then(
    (image) =>
      new Promise((resolve, reject) => {
        const scale = Math.min(1, MAX_IMAGE_WIDTH / image.naturalWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Your browser could not prepare the image.'));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be converted to WebP.'))),
          'image/webp',
          0.82
        );
      })
  );
}

export async function uploadMediaFile(
  file: File,
  folderPath: string = 'manga24',
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Please choose a JPEG, PNG, WebP, or GIF image.');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Images must be 10 MB or smaller.');
  }

  const { cloudName, uploadPreset } = getCloudinaryConfig();
  onProgress?.(10);
  const webpBlob = await convertToWebp(file);
  onProgress?.(35);

  const body = new FormData();
  body.append('file', webpBlob, `${folderPath}-${Date.now()}.webp`);
  body.append('upload_preset', uploadPreset);

  const response = await fetch(`${CLOUDINARY_UPLOAD_URL}/${encodeURIComponent(cloudName)}/image/upload`, {
    method: 'POST',
    body,
  });
  const result = (await response.json()) as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || 'The image upload failed. Please try again.');
  }
  onProgress?.(100);
  return result.secure_url;
}
