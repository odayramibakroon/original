import { createECDH, createPrivateKey } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { siteDatabase, SITE_DOCUMENT_PATH } from "../src/core/firebase/site-database.ts";

function validPrivateKey(value) {
  try { return createPrivateKey(value.replace(/\\n/g, "\n")).asymmetricKeyType === "rsa"; }
  catch { return false; }
}

function validUrl(value, production = false) {
  try {
    const url = new URL(value);
    return !url.username && !url.password && (url.protocol === "https:" ||
      (!production && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)));
  } catch { return false; }
}

export async function checkConfiguration(env, { production = false, read = readFile } = {}) {
  const checks = [];
  const add = (id, status, message) => checks.push({ id, status, message });
  const publicFirebase = ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_APP_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"];
  const missing = publicFirebase.filter((key) => !env[key]);
  add("firebaseClient", missing.length ? "FAIL" : "PASS", missing.length ? `Missing ${missing.join(", ")}.` : "Firebase browser configuration is present.");

  const firestoreEmulator = Boolean(env.FIRESTORE_EMULATOR_HOST);
  const authEmulator = Boolean(env.FIREBASE_AUTH_EMULATOR_HOST);
  if (firestoreEmulator || authEmulator) {
    add("firebaseAdmin", !production && firestoreEmulator && authEmulator ? "WARN" : "FAIL",
      production ? "Remove emulator variables before production deployment." : "Emulator configuration is not a live Firebase connection; both Auth and Firestore emulators are required.");
  } else if (env.FIREBASE_ADMIN_CLIENT_EMAIL && env.FIREBASE_ADMIN_PRIVATE_KEY) {
    const valid = /^[^\s@]+@[^\s@]+\.gserviceaccount\.com$/.test(env.FIREBASE_ADMIN_CLIENT_EMAIL) && validPrivateKey(env.FIREBASE_ADMIN_PRIVATE_KEY);
    add("firebaseAdmin", valid ? "PASS" : "FAIL", valid ? "Firebase Admin credentials are structurally valid; live permissions are not verified." : "Invalid Firebase Admin email or RSA private key.");
  } else if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const account = JSON.parse(await read(env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
      const valid = account.type === "service_account" && account.project_id === env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
        typeof account.client_email === "string" && /^[^\s@]+@[^\s@]+\.gserviceaccount\.com$/.test(account.client_email) &&
        typeof account.private_key === "string" && validPrivateKey(account.private_key);
      add("firebaseAdmin", valid ? "PASS" : "FAIL", valid ? "Service account matches the Firebase project; live permissions are not verified." : "Service account is invalid or belongs to another Firebase project.");
    } catch { add("firebaseAdmin", "FAIL", "Cannot read or parse the service account JSON. Check GOOGLE_APPLICATION_CREDENTIALS."); }
  } else if (env.FIREBASE_USE_APPLICATION_DEFAULT === "true") {
    add("firebaseAdmin", "WARN", "Application Default Credentials selected. Verify the hosting service identity and Firebase permissions.");
  } else {
    add("firebaseAdmin", "FAIL", "Firebase Admin is missing. Configure GOOGLE_APPLICATION_CREDENTIALS or both FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.");
  }

  add("supabase", validUrl(env.NEXT_PUBLIC_SUPABASE_URL, true) && Boolean(env.SUPABASE_SECRET_KEY) ? "PASS" : "FAIL",
    "Supabase requires an HTTPS NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SECRET_KEY.");
  try {
    const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    const privateKey = env.VAPID_PRIVATE_KEY || "";
    if (!/^[\w-]{87}$/.test(publicKey) || !/^[\w-]{43}$/.test(privateKey)) throw new Error();
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(Buffer.from(privateKey, "base64url"));
    if (!ecdh.getPublicKey().equals(Buffer.from(publicKey, "base64url"))) throw new Error();
    add("pushKeys", "PASS", "Web Push public and private keys match.");
  } catch { add("pushKeys", "FAIL", "Web Push keys are missing, invalid or mismatched. Restore the matching pair or run setup:push for a new installation."); }
  const subject = env.VAPID_SUBJECT || "";
  const validSubject = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subject) || validUrl(subject, true);
  add("pushContact", validSubject ? (subject === "mailto:info@factory.com" ? "WARN" : "PASS") : "FAIL",
    subject === "mailto:info@factory.com" ? "Replace the sample VAPID_SUBJECT with the real company contact before deployment." : "VAPID_SUBJECT must be a contact email (mailto:) or HTTPS URL.");
  add("cronSecret", (env.NOTIFICATION_CRON_SECRET?.length ?? 0) >= 32 ? "PASS" : "FAIL", "Notification retry requires a random NOTIFICATION_CRON_SECRET of at least 32 characters.");
  add("siteUrl", validUrl(env.NEXT_PUBLIC_SITE_URL, production) ? "PASS" : production ? "FAIL" : "WARN",
    "Set NEXT_PUBLIC_SITE_URL to the website URL; production requires HTTPS.");
  add("delivery", "WARN", "Live push delivery still requires an admin account, a subscribed device, and the authenticated retry schedule. This check sends no notifications.");
  return checks;
}

export async function checkStorage(env) {
  const { createClient } = await import("@supabase/supabase-js");
  try {
    const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(10000) }) },
    });
    const { data, error } = await client.storage.listBuckets();
    if (error) throw new Error();
    const bucket = data.find((item) => item.name === (env.SUPABASE_MEDIA_BUCKET || "site-media"));
    if (!bucket) return { id: "storageConnection", status: "WARN", message: "Supabase connection succeeded. Media bucket is absent; the app creates it on the first authorized upload." };
    return { id: "storageConnection", status: bucket.public ? "PASS" : "FAIL", message: bucket.public ? "Supabase connection succeeded and the media bucket permits public reads. Write permissions were not tested." : "The media bucket is private; public website images require public reads." };
  } catch { return { id: "storageConnection", status: "FAIL", message: "Supabase read-only connection check failed. Verify the server key, URL, permissions and network." }; }
}

export async function checkFirebase(env) {
  const { initializeApp, applicationDefault, cert, deleteApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const { getAuth } = await import("firebase-admin/auth");
  let app;
  let db;
  const checks = [];
  let stage = "initialization";
  try {
    app = initializeApp({ projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      credential: env.FIREBASE_ADMIN_CLIENT_EMAIL && env.FIREBASE_ADMIN_PRIVATE_KEY
        ? cert({ projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n") })
        : applicationDefault(),
    }, "service-readiness");
    const firestore = getFirestore(app);
    firestore.settings({ preferRest: true });
    db = siteDatabase(firestore);
    stage = "site content read";
    const site = await db.doc("siteContent/main").get();
    checks.push({ id: "firestoreConnection", status: "PASS", message: site.exists ? "Live Firestore read succeeded; site content exists." : "Live Firestore read succeeded; original site content has not been imported." });
    stage = "admin role read";
    const admins = await db.collection("users").where("role", "==", "admin").where("active", "==", true).limit(1).get();
    checks.push({ id: "adminRole", status: admins.empty ? "WARN" : "PASS", message: admins.empty ? "No active website admin role found. Assign the intended Firebase Auth account explicitly." : "An active admin role exists. Sign in to verify its Firebase Auth account." });
    stage = "Authentication configuration read";
    await getAuth(app).projectConfigManager().getProjectConfig();
    checks.push({ id: "firebaseAuthConnection", status: "PASS", message: "Live Firebase Authentication configuration read succeeded. No users were created or changed." });
    const privatePath = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)}/databases/(default)/documents/${SITE_DOCUMENT_PATH}/contactMessages/access-check?key=${encodeURIComponent(env.NEXT_PUBLIC_FIREBASE_API_KEY)}`;
    stage = "anonymous privacy check";
    const anonymous = await fetch(privatePath, { signal: AbortSignal.timeout(10000) });
    const response = await anonymous.json();
    const denied = anonymous.status === 403 && response.error?.status === "PERMISSION_DENIED";
    checks.push({ id: "privateDataRules", status: denied ? "PASS" : "FAIL", message: denied ? "Anonymous Firestore access to website messages is denied." : "Website privacy rules need review: an anonymous document request was not denied. Do not collect real messages until this is resolved." });
  } catch (error) {
    const code = typeof error?.code === "number" || /^(auth\/[a-z-]+|E[A-Z]+)$/.test(error?.code) ? String(error.code) : "unclassified";
    checks.push({ id: "firebaseConnection", status: "FAIL", message: `Live Firebase ${stage} failed (${code}). Verify configuration, network and service account permissions. Credential details are not logged.` });
  } finally {
    if (db) await db.terminate();
    if (app) await deleteApp(app);
  }
  return checks;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !["--online", "--production"].includes(arg))) {
    console.error("Usage: npm run check:services -- [--online] [--production]"); process.exitCode = 1; return;
  }
  const production = args.includes("--production");
  const { loadEnvConfig } = createRequire(import.meta.url)("@next/env");
  loadEnvConfig(process.cwd(), !production, { info() {}, error() {} });
  const checks = await checkConfiguration(process.env, { production });
  if (args.includes("--online") && checks.find((item) => item.id === "firebaseAdmin").status === "PASS") checks.push(...await checkFirebase(process.env));
  if (args.includes("--online") && checks.find((item) => item.id === "supabase").status === "PASS") checks.push(await checkStorage(process.env));
  for (const check of checks) console.log(`[${check.status}] ${check.id}: ${check.message}`);
  console.log("No credentials, files, user accounts, buckets or application data were changed.");
  if (checks.some((check) => check.status === "FAIL")) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error("Service checks could not finish. No credential details are logged."); process.exitCode = 1; });
}
