import "server-only";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { siteDatabase } from "./site-database";

export function isAdminConfigured() {
  return Boolean(
    (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_USE_APPLICATION_DEFAULT === "true" ||
    (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST),
  );
}

function getAdminApp() {
  const existing = getApps().find((app) => app.name === "server");
  if (existing) return existing;
  if (!isAdminConfigured()) throw new Error("Firebase Admin credentials are not configured.");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const emulator = process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST;
  return initializeApp({
    projectId,
    ...(emulator ? {} : {
      credential: process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY
        ? cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n") })
        : applicationDefault(),
    }),
  }, "server");
}

export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminDb = () => siteDatabase(getFirestore(getAdminApp()));
