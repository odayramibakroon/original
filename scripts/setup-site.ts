import { loadEnvConfig } from "@next/env";
import { getApps, deleteApp } from "firebase-admin/app";
import { getAdminDb } from "../src/core/firebase/admin";
import { SITE_DOCUMENT_PATH } from "../src/core/firebase/site-database";
import { getSupabaseServerClient } from "../src/core/supabase/server";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "../src/features/media/domain/MediaAsset";
import { importOriginalContent } from "../src/features/admin/application/import-original-content";

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply")) throw new Error("Use --apply to initialize the website.");
  loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error("This setup command targets the live configured project only.");
  const db = getAdminDb();
  try {
    const count = await db.collection("products").count().get();
    console.log(`Website namespace: ${SITE_DOCUMENT_PATH}. Existing website products: ${count.data().count}.`);
    if (!args.includes("--apply")) { console.log("Read-only check. No content, accounts or storage were changed."); return; }
    const result = await importOriginalContent("bootstrap:service-account");
    console.log(`Content: ${JSON.stringify(result)}. Existing records were not overwritten.`);
    const supabase = getSupabaseServerClient();
    const bucket = process.env.SUPABASE_MEDIA_BUCKET || "site-media";
    const listed = await supabase.storage.listBuckets();
    if (listed.error) throw new Error("Could not verify media buckets.");
    const existing = listed.data.find((item) => item.name === bucket);
    if (existing && !existing.public) throw new Error("The existing media bucket is private; no permissions were changed.");
    if (!existing) {
      const created = await supabase.storage.createBucket(bucket, { public: true, allowedMimeTypes: IMAGE_TYPES, fileSizeLimit: MAX_IMAGE_BYTES });
      if (created.error) throw new Error("Could not create the media bucket.");
    }
    console.log("Media bucket is ready. No accounts or legacy root products were changed.");
  } finally {
    await db.terminate();
    const app = getApps().find((item) => item.name === "server");
    if (app) await deleteApp(app);
  }
}

main().catch(() => { console.error("Website setup did not complete. Run check:services and review configuration. Credential details are not logged."); process.exitCode = 1; });
