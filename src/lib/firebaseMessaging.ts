import { getFirebaseMessaging } from "./firebase";

let tokenCache: string | null = null;

const getVapidKey = (): string | undefined => {
  const key = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  return key && key.trim().length > 0 ? key : undefined;
};

export const initializeFirebaseMessaging = async (): Promise<string | null> => {
  if (!("Notification" in window)) {
    console.warn("Notifications are not supported in this browser.");
    return null;
  }

  if (tokenCache) {
    return tokenCache;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Notification permission not granted.");
    return null;
  }

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return null;
    }

    const { getToken, onMessage } = await import("firebase/messaging");

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const vapidKey = getVapidKey();
    if (!vapidKey) {
      console.warn(
        "Missing VITE_FIREBASE_VAPID_KEY. Push notifications will not work."
      );
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    tokenCache = token;
    console.info("Firebase Messaging token acquired:", token);

    onMessage(messaging, (payload) => {
      console.info("Foreground notification received:", payload);
      if (payload.notification?.title) {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon,
        });
      }
    });

    return token;
  } catch (error) {
    console.error("Failed to initialize Firebase Messaging:", error);
    return null;
  }
};

