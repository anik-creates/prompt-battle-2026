// Real-Time Cross-Device Synchronization Engine
// Seamlessly syncs between Projector Presentation Screen, Admin Laptop, and Participants' Mobile phones

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';

const STORAGE_KEY = 'pb_firebase_config_v1';
const FIRESTORE_COLLECTION = 'prompt_battles';
const FIRESTORE_DOC = 'eee_fest_2026';

let appInstance = null;
let dbInstance = null;
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
    return { success: false, error: 'Incomplete or missing Firebase configuration' };
  }

  try {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(activeConfig);
    }
    dbInstance = getFirestore(appInstance);
    return { success: true, app: appInstance, db: dbInstance };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return { success: false, error: err.message };
  }
}

export function isFirebaseReady() {
  return !!dbInstance;
}

export function subscribeToCloudState(callback, onError) {
  if (!dbInstance) {
    const res = initFirebase();
    if (!res.success) return () => {};
  }

  try {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }

    const docRef = doc(dbInstance, FIRESTORE_COLLECTION, FIRESTORE_DOC);
    unsubscribeSnapshot = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data());
        }
      },
      (err) => {
        console.warn('Firebase onSnapshot error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribeSnapshot;
  } catch (e) {
    console.error('Failed to subscribe to Firestore:', e);
    if (onError) onError(e);
    return () => {};
  }
}

export async function pushStateToCloud(stateData) {
  if (!dbInstance) {
    const res = initFirebase();
    if (!res.success) return false;
  }

  try {
    const docRef = doc(dbInstance, FIRESTORE_COLLECTION, FIRESTORE_DOC);
    // Sanitize state for Firestore (no undefined values)
    const sanitized = JSON.parse(JSON.stringify(stateData));
    sanitized.lastUpdated = Date.now();
    await setDoc(docRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    console.error('Error writing to Firestore:', err);
    return false;
  }
}
