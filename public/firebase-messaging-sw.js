/* eslint-disable no-undef */
// This file is loaded directly by the browser and is not processed by Vite.
// Replace the placeholder values below with your Firebase project configuration
// or inject them during your deployment process.

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "TMWY";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: payload.notification?.icon || "/2.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

