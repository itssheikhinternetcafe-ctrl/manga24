/**
 * Manga24 - Firebase SDK Configuration & Initialization
 * 
 * ==============================================================================
 * SETUP INSTRUCTIONS:
 * ==============================================================================
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Enable "Authentication" -> Sign-in methods -> Enable "Email/Password" and "Google".
 * 3. Enable "Cloud Firestore" (Start in production mode or test mode).
 * 4. Enable "Cloud Storage" (for cover images and chapter page uploads).
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
import { getStorage, FirebaseStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
let storage: FirebaseStorage | null = null;

export function initFirebase() {
  if (isFirebaseConfigured() && !app) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      try {
        // ignoreUndefinedProperties: Firestore rejects `undefined` values, this prevents silent save failures
        db = initializeFirestore(app, { ignoreUndefinedProperties: true });
      } catch {
        db = getFirestore(app);
      }
      storage = getStorage(app);
    } catch (error) {
      console.warn('[Firebase] Initialization deferred or fallback active:', error);
    }
  }
}

initFirebase();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, db, storage, firebaseConfig };

/**
 * Upload helper that uploads a file to Firebase Storage if configured,
 * or safely falls back to a base64 DataURL for instant local/preview testing.
 */
export async function uploadMediaFile(
  file: File,
  folderPath: string = 'covers',
  onProgress?: (progress: number) => void
): Promise<string> {
  // If Firebase Storage is active and configured
  if (isFirebaseConfigured() && storage) {
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${folderPath}/${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          },
          (error) => {
            console.error('[Firebase Storage] Upload failed:', error);
            reject(error);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          }
        );
      });
    } catch (err) {
      console.warn('[Firebase Storage] Error uploading, falling back to data URL', err);
    }
  }

  // Fallback when Firebase Storage is unavailable (it needs the Blaze plan):
  // shrink the image and store it as a small data URL inside the Firestore document.
  // Firestore documents are limited to 1MB, so covers are resized to max 600px wide JPEG.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read image'));
      img.onload = () => {
        const maxW = 600;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (onProgress) onProgress(100);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
