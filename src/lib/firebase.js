// Real-Time Cross-Device Synchronization Engine
// Supports both Firebase Realtime Database (RTDB) and Cloud Firestore
// Seamlessly syncs Projector Screen, Admin Laptop, and Participants' Mobile phones

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

let appInstance = null;
let firestoreInstance = null;
let rtdbInstance = null;
let activeDatabaseType = null; // 'rtdb' | 'firestore'
let unsubscribeSnapshot = null;

export function getStoredFirebaseConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored firebase config:', e);
    return null;
  }
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
    return { success: false, error: 'Incomplete or missing Firebase configuration (apiKey, projectId required)' };
  }

  try {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(activeConfig);
    }

    // Detect if Realtime Database is configured (via databaseURL or explicit config)
    if (activeConfig.databaseURL) {
      rtdbInstance = getDatabase(appInstance, activeConfig.databaseURL);
      activeDatabaseType = 'rtdb';
      return { success: true, app: appInstance, db: rtdbInstance, type: 'rtdb' };
    }

    // Try Realtime Database with default URL if not specified
    try {
      const defaultUrl = `https://${activeConfig.projectId}-default-rtdb.firebaseio.com`;
      rtdbInstance = getDatabase(appInstance, defaultUrl);
      activeDatabaseType = 'rtdb';
      return { success: true, app: appInstance, db: rtdbInstance, type: 'rtdb' };
    } catch (rtdbErr) {
      console.info('Falling back to Cloud Firestore:', rtdbErr);
    }

    // Fallback to Cloud Firestore
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

    // 1. If using Firebase Realtime Database
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

    // 2. If using Cloud Firestore
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
