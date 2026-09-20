import { test } from "node:test";
import assert from "node:assert/strict";
import { createECDH, generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkConfiguration } from "./check-services.mjs";

const ecdh = createECDH("prime256v1");
ecdh.generateKeys();
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const env = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "test-key", NEXT_PUBLIC_FIREBASE_APP_ID: "test-app",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-project", NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-project.firebaseapp.com",
  GOOGLE_APPLICATION_CREDENTIALS: "local-service-account.json",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", SUPABASE_SECRET_KEY: "test-secret",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: ecdh.getPublicKey().toString("base64url"), VAPID_PRIVATE_KEY: ecdh.getPrivateKey().toString("base64url"),
  VAPID_SUBJECT: "mailto:admin@example.test", NOTIFICATION_CRON_SECRET: "a".repeat(64), NEXT_PUBLIC_SITE_URL: "https://example.test",
};
const account = { type: "service_account", project_id: "demo-project", client_email: "server@demo-project.iam.gserviceaccount.com", private_key: privateKey };
const read = async () => JSON.stringify(account);
const find = (checks, id) => checks.find((check) => check.id === id);

test("accepts a valid project-matched configuration without claiming live delivery", async () => {
  const checks = await checkConfiguration(env, { read, production: true });
  assert.equal(checks.some((check) => check.status === "FAIL"), false);
  assert.equal(find(checks, "firebaseAdmin").status, "PASS");
  assert.equal(find(checks, "delivery").status, "WARN");
});

test("detects missing server credentials despite valid browser configuration", async () => {
  const checks = await checkConfiguration({ ...env, GOOGLE_APPLICATION_CREDENTIALS: "" });
  assert.equal(find(checks, "firebaseClient").status, "PASS");
  assert.equal(find(checks, "firebaseAdmin").status, "FAIL");
});

test("rejects mismatched project and malformed credential files", async () => {
  for (const content of ["not json", JSON.stringify({ ...account, project_id: "other-project" }), JSON.stringify({ ...account, private_key: "invalid" })]) {
    assert.equal(find(await checkConfiguration(env, { read: async () => content }), "firebaseAdmin").status, "FAIL");
  }
});

test("never includes secret values or raw filesystem errors in output", async () => {
  const checks = await checkConfiguration(env, { read: async () => { throw new Error(`Denied ${env.SUPABASE_SECRET_KEY} ${privateKey}`); } });
  const output = JSON.stringify(checks);
  for (const secret of [env.SUPABASE_SECRET_KEY, privateKey, env.VAPID_PRIVATE_KEY, env.NOTIFICATION_CRON_SECRET]) assert.equal(output.includes(secret), false);
});

test("rejects a mismatched VAPID key pair", async () => {
  const other = createECDH("prime256v1"); other.generateKeys();
  const checks = await checkConfiguration({ ...env, VAPID_PRIVATE_KEY: other.getPrivateKey().toString("base64url") }, { read });
  assert.equal(find(checks, "pushKeys").status, "FAIL");
});

test("rejects emulator and insecure website configuration in production", async () => {
  const checks = await checkConfiguration({ ...env, FIRESTORE_EMULATOR_HOST: "localhost:8080", FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }, { production: true });
  assert.equal(find(checks, "firebaseAdmin").status, "FAIL");
  assert.equal(find(checks, "siteUrl").status, "FAIL");
});

test("accepts inline RSA credentials and escaped newlines", async () => {
  const checks = await checkConfiguration({ ...env, GOOGLE_APPLICATION_CREDENTIALS: "", FIREBASE_ADMIN_CLIENT_EMAIL: account.client_email, FIREBASE_ADMIN_PRIVATE_KEY: privateKey.replace(/\n/g, "\\n") });
  assert.equal(find(checks, "firebaseAdmin").status, "PASS");
});

test("CLI runs without credentials and reports missing configuration without leaking environment values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "originalcompany-readiness-"));
  try {
    const result = spawnSync(process.execPath, ["--import", import.meta.resolve("tsx"), fileURLToPath(new URL("./check-services.mjs", import.meta.url))], {
      cwd: directory, encoding: "utf8", timeout: 10000,
      env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, SUPABASE_SECRET_KEY: "do-not-print-this-test-secret" },
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /\[FAIL\] firebaseAdmin/);
    assert.equal(result.stderr, "");
    assert.equal(result.stdout.includes("do-not-print-this-test-secret"), false);
  } finally { await rmdir(directory); }
});
