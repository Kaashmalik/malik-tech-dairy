// Firebase Admin SDK (Server-side only)
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;
let adminStorage: Storage | undefined;

// Initialize Firebase Admin only on server
if (typeof window === 'undefined' && !getApps().length) {
  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (
      !privateKey ||
      !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
      !process.env.FIREBASE_ADMIN_PROJECT_ID
    ) {
      console.warn('Firebase Admin credentials not found. Admin features will be disabled.');
    } else {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });

      adminDb = getFirestore(adminApp);
      adminStorage = getStorage(adminApp);
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export { adminApp, adminDb, adminStorage };
