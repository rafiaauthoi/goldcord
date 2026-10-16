import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { browserLocalPersistence, indexedDBLocalPersistence, initializeAuth } from "firebase/auth";

declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});

let appCheckStarted = false;

export function startAppCheck() {
  if (appCheckStarted) return;
  appCheckStarted = true;
  if (import.meta.env.DEV) {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

const INTERACTION_EVENTS = ["pointerdown", "keydown", "focusin", "touchstart", "scroll"];
const FALLBACK_DELAY_MS = 4000;

export function startAppCheckAfterFirstPaint() {
  const start = () => {
    INTERACTION_EVENTS.forEach((name) => window.removeEventListener(name, start, true));
    startAppCheck();
  };
  INTERACTION_EVENTS.forEach((name) => window.addEventListener(name, start, { capture: true, passive: true }));
  const startLater = () => setTimeout(start, FALLBACK_DELAY_MS);
  if (document.readyState === "complete") {
    startLater();
  } else {
    window.addEventListener("load", startLater, { once: true });
  }
}