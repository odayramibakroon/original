import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { initializeApp, applicationDefault, cert, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { chromium } from "@playwright/test";
import { siteDatabase } from "../src/core/firebase/site-database.ts";

if (process.argv[2] !== "--confirm-live-test") {
  console.error("This opt-in check creates and removes one synthetic contact on the configured Firebase project. Run with --confirm-live-test against the local app on port 3000.");
  process.exit(1);
}
createRequire(import.meta.url)("@next/env").loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error("This check is only for the configured live project.");
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const app = initializeApp({ projectId, credential: process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ? cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n") })
  : applicationDefault(),
}, "live-contact-verification");
const firestore = getFirestore(app);
firestore.settings({ preferRest: true });
const db = siteDatabase(firestore);
const name = `Connection check ${randomUUID()}`;
const email = "connection-check@example.invalid";
const phone = `+999${Date.now().toString().slice(-11)}`;
const message = "Synthetic connection verification. Automatically removed after this check.";
const rate = db.doc(`contactRateLimits/${createHash("sha256").update(phone.replace(/\D/g, "")).digest("hex")}`);
let browser;

try {
  const subscriptions = await db.collection("adminPushSubscriptions").limit(1).get();
  assert.equal(subscriptions.empty, true, "Existing push subscribers detected; refusing to send a synthetic notification.");
  browser = await chromium.launch({ channel: "chrome" });
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded" });
  await page.locator('[name="name"]').fill(name);
  await page.locator('[name="email"]').fill(email);
  await page.locator('[name="phone"]').fill(phone);
  await page.locator('[name="message"]').fill(message);
  await page.locator('.contact-form button[type="submit"]').click();
  await page.locator(".form-result.success").waitFor({ timeout: 60000 });
  const records = await db.collection("contactMessages").where("name", "==", name).get();
  assert.equal(records.size, 1);
  const record = records.docs[0];
  assert.equal(record.data().email, email);
  assert.equal(record.data().phone, phone);
  const job = (await db.doc(`notificationOutbox/${record.id}`).get()).data();
  assert.equal(job?.status, "pending");
  assert.equal(job?.lastResult, "no-subscribers");
  await page.goto("http://127.0.0.1:3000/login");
  assert.equal(await page.getByRole("button", { name: "Sign in", exact: true }).isEnabled(), true);
  console.log("PASS: browser submission saved the email and phone in live Firestore and created a durable notification job.");
  console.log("PASS: live admin login is enabled. Device delivery was not tested because no admin device is subscribed.");
} catch (error) {
  console.error(`Live verification did not finish (${error instanceof Error ? error.name : "unknown error"}). Credential details are not logged.`);
  process.exitCode = 1;
} finally {
  try {
    const records = await db.collection("contactMessages").where("name", "==", name).get();
    const batch = db.batch();
    let removed = 0;
    for (const record of records.docs) {
      const data = record.data();
      // Only remove records owned by this exact invocation, never existing contacts.
      if (data.email === email && data.phone === phone && data.message === message) {
        batch.delete(record.ref); batch.delete(db.doc(`notificationOutbox/${record.id}`)); removed++;
      }
    }
    const rateData = await rate.get();
    if (rateData.exists && rateData.data().count === 1 && removed === 1) batch.delete(rate);
    await batch.commit();
    console.log(`Cleanup: removed ${removed} synthetic contact(s) and their notification jobs.`);
  } catch {
    console.error(`Cleanup failed. Locate only the synthetic contact with name: ${name}`);
    process.exitCode = 1;
  }
  if (browser) await browser.close();
  await db.terminate();
  await deleteApp(app);
}
