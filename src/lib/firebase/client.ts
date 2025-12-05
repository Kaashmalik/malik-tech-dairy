// Firebase Client SDK Configuration
// LIMITED USE: Only for real-time activity feeds (50K reads/day)
// All other data is stored in Supabase PostgreSQL
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let auth: Auth | undefined;
let realtimeDb: Database | undefined;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

/**
 * Initialize Firebase - can be called from both client and server
 */
function initializeFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    if (firebaseConfig.databaseURL) {
      realtimeDb = getDatabase(app);
    }
  } else {
    app = getApps()[0];
    db = getFirestore(app);
    storage = getStorage(app);
    if (firebaseConfig.databaseURL) {
      realtimeDb = getDatabase(app);
    }
  }
}

// Initialize on import
initializeFirebase();

/**
 * Get Firestore instance - throws if not initialized
 */
export function getFirestoreDb(): Firestore {
  if (!db) {
    initializeFirebase();
  }
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
}

/**
 * Get Storage instance - throws if not initialized
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    initializeFirebase();
  }
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }
  return storage;
}

export { app, db, storage, auth, realtimeDb };

