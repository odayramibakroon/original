import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { loadEnvConfig } from "@next/env";
import { deleteApp, getApps } from "firebase-admin/app";
import { getAdminDb } from "../src/core/firebase/admin";
import { getSupabaseServerClient } from "../src/core/supabase/server";
import { MediaRepository } from "../src/features/media/infrastructure/media-repository";
import type { MediaAsset } from "../src/features/media/domain/MediaAsset";

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== "--confirm-live-test") {
    throw new Error("Pass --confirm-live-test to upload and remove one isolated verification image.");
  }
  loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error("This command requires the live configured services.");
  }
  const owner = `connection-check-${randomUUID()}`;
  const repository = new MediaRepository();
  const db = getAdminDb();
  let asset: MediaAsset | undefined;
  let stage = "upload";
  try {
    const original = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#ffffff" } }).png().toBuffer();
    asset = await repository.upload(new File([new Uint8Array(original)], "connection-check.png", { type: "image/png" }), owner);
    assert.ok(asset.path.startsWith(`${owner}/`));
    stage = "metadata read";
    const document = await db.doc(`media/${asset.id}`).get();
    assert.equal(document.data()?.createdBy, owner);
    assert.equal(document.data()?.url, asset.url);
    stage = "public image read";
    const response = await fetch(asset.url, { signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200);
    assert.ok(Buffer.from(await response.arrayBuffer()).equals(original));
    console.log("PASS: live Supabase upload and public image bytes match the original; website media metadata is persisted.");
  } catch {
    console.error(`Live media verification failed at ${stage}. No credential details are logged.`);
    process.exitCode = 1;
  } finally {
    try {
      if (asset) {
        assert.ok(asset.path.startsWith(`${owner}/`));
        await repository.delete(asset.id);
        assert.equal((await db.doc(`media/${asset.id}`).get()).exists, false);
        const remaining = await getSupabaseServerClient().storage.from(process.env.SUPABASE_MEDIA_BUCKET || "site-media").list(owner);
        assert.equal(remaining.error, null);
        assert.equal(remaining.data?.length, 0);
        console.log("PASS: only the verification image and its metadata were removed. Existing images and site content were not changed.");
      }
    } catch {
      console.error(`Verification cleanup failed. Review only the media entry for ${owner}.`);
      process.exitCode = 1;
    } finally {
      await db.terminate();
      const app = getApps().find((item) => item.name === "server");
      if (app) await deleteApp(app);
    }
  }
}

main().catch(() => {
  console.error("Use --confirm-live-test with the live Firebase and Supabase configuration. No credential details are logged.");
  process.exitCode = 1;
});
