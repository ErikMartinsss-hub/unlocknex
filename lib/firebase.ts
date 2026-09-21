import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseIsConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function getAppFirebase(): FirebaseApp {
  if (!firebaseIsConfigured) {
    throw new Error('Firebase não configurado. Preencha as variáveis em .env.local (ver .env.local.example).');
  }
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getAuthFirebase(): Auth {
  if (!auth) auth = getAuth(getAppFirebase());
  return auth;
}

export function getDbFirebase(): Firestore {
  if (!db) db = getFirestore(getAppFirebase());
  return db;
}