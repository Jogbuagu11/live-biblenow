import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import type { Messaging } from "firebase/messaging";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

let firebaseApp: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;
let messagingInstance: Messaging | null = null;

export const getFirebaseApp = (): FirebaseApp => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.appId ||
    !firebaseConfig.projectId
  ) {
    throw new Error(
      "Missing Firebase configuration. Please check your VITE_FIREBASE_* environment variables."
    );
  }

  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return firebaseApp;
};

export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  if (analyticsInstance) {
    return analyticsInstance;
  }

  try {
    const app = getFirebaseApp();
    const analyticsModule = await import("firebase/analytics");
    analyticsInstance = analyticsModule.getAnalytics(app);
    return analyticsInstance;
  } catch (error) {
    console.warn("Firebase Analytics is unavailable in this environment.", error);
    return null;
  }
};

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (messagingInstance) {
    return messagingInstance;
  }

  try {
    const { isSupported, getMessaging } = await import("firebase/messaging");
    if (!(await isSupported())) {
      console.warn("Firebase Messaging is not supported in this browser.");
      return null;
    }
    const app = getFirebaseApp();
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.warn("Unable to initialize Firebase Messaging.", error);
    return null;
  }
};

