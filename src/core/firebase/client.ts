import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFirebasePublicConfig } from "@/core/config/env";

export function getFirebaseApp() {
  const apps = getApps();

  if (apps.length > 0) {
    return apps[0];
  }

  return initializeApp(getFirebasePublicConfig());
}

export function getFirebaseAuth() {
  const auth = getAuth(getFirebaseApp());
  if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST && !auth.emulatorConfig) {
    connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  }
  return auth;
}

export function getFirebaseDb() {
  return getFirestore(getFirebaseApp());
}
