import { parseArgs } from "node:util";
import { loadEnvConfig } from "@next/env";
import { deleteApp, getApps } from "firebase-admin/app";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "../src/core/firebase/admin";
import { SITE_DOCUMENT_PATH } from "../src/core/firebase/site-database";
import { isActiveAdmin } from "../src/core/auth/roles";

class SetupError extends Error {}

async function main() {
  const { values } = parseArgs({ options: {
    email: { type: "string" }, apply: { type: "boolean", default: false },
  }, allowPositionals: false });
  const email = z.email().parse(values.email?.trim().toLowerCase());
  loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new SetupError("This setup command requires the live configured project.");
  }
  const auth = getAdminAuth();
  const db = getAdminDb();
  try {
    const account = await auth.getUserByEmail(email).catch((error: { code?: string }) => {
      if (error.code === "auth/user-not-found") return null;
      throw error;
    });
    if (!account) {
      throw new SetupError("No Firebase Authentication account exists for this email. Create the intended account in Firebase Console first. Nothing was changed.");
    }
    if (account.disabled) throw new SetupError("This account is disabled. No permissions or account status were changed.");
    const role = db.doc(`users/${account.uid}`);
    if (values.apply) {
      await db.runTransaction(async (transaction) => {
        const current = await transaction.get(role);
        if (isActiveAdmin(current.data()) && current.data()?.email === email) return;
        transaction.set(role, {
          role: "admin", active: true, email,
          updatedAt: FieldValue.serverTimestamp(), updatedBy: "setup:service-account",
          ...(!current.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
        }, { merge: true });
      });
    }
    const enabled = isActiveAdmin((await role.get()).data());
    console.log(`Website admin role active: ${enabled}. Scope: ${SITE_DOCUMENT_PATH}/users.`);
    console.log(values.apply
      ? "Existing passwords, global Auth claims and legacy role documents were not changed. Device push permission is still required."
      : "Read-only check. No accounts, passwords or permissions were changed.");
  } finally {
    await db.terminate();
    const app = getApps().find((item) => item.name === "server");
    if (app) await deleteApp(app);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof SetupError ? error.message : "Admin setup failed. Check --email, Firebase configuration and permissions. Credential details are not logged.");
  process.exitCode = 1;
});
