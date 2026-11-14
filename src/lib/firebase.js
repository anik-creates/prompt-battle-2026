// Real-Time Cross-Device Synchronization Engine
// Pre-configured with IEEE PES DIU SBC Prompt Battle Firebase Realtime Database
// Syncs Projector Screen, Admin Laptop, and Participants' Mobile Phones in Real-Time

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getDatabase, 
  ref as rtdbRef, 
  set as rtdbSet, 
  onValue as rtdbOnValue 
} from 'firebase/database';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';

const STORAGE_KEY = 'pb_firebase_config_v1';
const FIRESTORE_COLLECTION = 'prompt_battles';
const FIRESTORE_DOC = 'eee_fest_2026';
const RTDB_PATH = 'prompt_battles/eee_fest_2026';

// Official EEE FEST 2026 Prompt Battle Firebase Project Configuration
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCKXamq-_3Z_vOXP_2o4oY7LEd4SDKu3_M",
  authDomain: "promptbattle-25930.firebaseapp.com",
  databaseURL: "https://promptbattle-25930-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "promptbattle-25930",
  storageBucket: "promptbattle-25930.firebasestorage.app",
  messagingSenderId: "521534790921",
  appId: "1:521534790921:web:75f1a5d712ba58a14107d8",
  measurementId: "G-6WDSG1TDQL"
};

let appInstance = null;
let firestoreInstance = null;
let rtdbInstance = null;
let activeDatabaseType = null; // 'rtdb' | 'firestore'
let unsubscribeSnapshot = null;

export function getStoredFirebaseConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored firebase config:', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveStoredFirebaseConfig(config) {
  try {
    if (!config) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save firebase config:', e);
  }
}

export function initFirebase(config = null) {
  const activeConfig = config || getStoredFirebaseConfig();
  if (!activeConfig || !activeConfig.apiKey || !activeConfig.projectId) {
    return { success: false, error: 'Incomplete or missing Firebase configuration' };
  }

  try {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(activeConfig);
    }

    // Connect to Firebase Realtime Database
    if (activeConfig.databaseURL) {
      rtdbInstance = getDatabase(appInstance, activeConfig.databaseURL);
      activeDatabaseType = 'rtdb';
      return { success: true, app: appInstance, db: rtdbInstance, type: 'rtdb' };
    }

    // Try default regional RTDB URL if not explicitly defined
    try {
      const defaultUrl = `https://${activeConfig.projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;
      rtdbInstance = getDatabase(appInstance, defaultUrl);
      activeDatabaseType = 'rtdb';
      return { success: true, app: appInstance, db: rtdbInstance, type: 'rtdb' };
    } catch (e) {
      console.info('Falling back to Cloud Firestore:', e);
    }

    // Cloud Firestore Fallback
    firestoreInstance = getFirestore(appInstance);
    activeDatabaseType = 'firestore';
    return { success: true, app: appInstance, db: firestoreInstance, type: 'firestore' };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return { success: false, error: err.message };
  }
}

export function isFirebaseReady() {
  return !!(rtdbInstance || firestoreInstance);
}

export function subscribeToCloudState(callback, onError) {
  if (!rtdbInstance && !firestoreInstance) {
    const res = initFirebase();
    if (!res.success) return () => {};
  }

  try {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }

    // 1. Realtime Database Listener
    if (rtdbInstance && activeDatabaseType === 'rtdb') {
      const dbReference = rtdbRef(rtdbInstance, RTDB_PATH);
      const unsub = rtdbOnValue(
        dbReference,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            callback(data);
          }
        },
        (err) => {
          console.warn('Realtime Database onValue error:', err);
          if (onError) onError(err);
        }
      );

      unsubscribeSnapshot = unsub;
      return unsub;
    }

    // 2. Cloud Firestore Listener
    if (firestoreInstance) {
      const docRef = doc(firestoreInstance, FIRESTORE_COLLECTION, FIRESTORE_DOC);
      const unsub = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            callback(snapshot.data());
          }
        },
        (err) => {
          console.warn('Firestore onSnapshot error:', err);
          if (onError) onError(err);
        }
      );

      unsubscribeSnapshot = unsub;
      return unsub;
    }

    return () => {};
  } catch (e) {
    console.error('Failed to subscribe to cloud database:', e);
    if (onError) onError(e);
    return () => {};
  }
}

export async function pushStateToCloud(stateData) {
  if (!rtdbInstance && !firestoreInstance) {
    const res = initFirebase();
    if (!res.success) return false;
  }

  try {
    const sanitized = JSON.parse(JSON.stringify(stateData));
    sanitized.lastUpdated = Date.now();

    // 1. Push to Realtime Database
    if (rtdbInstance && activeDatabaseType === 'rtdb') {
      const dbReference = rtdbRef(rtdbInstance, RTDB_PATH);
      await rtdbSet(dbReference, sanitized);
      return true;
    }

    // 2. Push to Firestore
    if (firestoreInstance) {
      const docRef = doc(firestoreInstance, FIRESTORE_COLLECTION, FIRESTORE_DOC);
      await setDoc(docRef, sanitized, { merge: true });
      return true;
    }

    return false;
  } catch (err) {
    console.error('Error writing state to cloud database:', err);
    return false;
  }
}
