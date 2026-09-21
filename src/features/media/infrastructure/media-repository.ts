import "server-only";
import { randomUUID } from "node:crypto";
import { parse } from "node:path";
import sharp from "sharp";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/firebase/admin";
import { getSupabaseServerClient } from "@/core/supabase/server";
import { createSafeFilename } from "@/core/storage/safe-filename";
import { AppError, ErrorCode, normalizeError } from "@/core/errors";
import { logger } from "@/core/logger";
import { DEFAULT_IMAGE_BYTES, IMAGE_TYPES, type MediaAsset } from "../domain/MediaAsset";
import { ImageTooLargeError } from "../domain/upload-limit";
import { MediaPolicyRepository } from "./media-policy-repository";

function containsUrl(value: unknown, url: string): boolean {
  if (typeof value === "string") return value === url;
  if (Array.isArray(value)) return value.some((item) => containsUrl(item, url));
  if (value && typeof value === "object") return Object.values(value).some((item) => containsUrl(item, url));
  return false;
}

export class MediaRepository {
  private bucket = process.env.SUPABASE_MEDIA_BUCKET || "site-media";
  async list(): Promise<MediaAsset[]> {
    try {
      const records = await getAdminDb().collection("media").orderBy("createdAt", "desc").get();
      return records.docs.map((doc) => {
        const data = doc.data();
        return { id: doc.id, name: data.name, url: data.url, path: data.path, bytes: data.bytes, width: data.width, height: data.height, createdAt: data.createdAt?.toDate().toISOString() ?? "" };
      });
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
  async upload(file: File, uid: string): Promise<MediaAsset> {
    if (!IMAGE_TYPES.includes(file.type) || !file.size) throw new AppError(ErrorCode.VALIDATION_ERROR, "invalidFile");
    const maxBytes = await new MediaPolicyRepository().getLimit();
    if (file.size > maxBytes) throw new ImageTooLargeError(maxBytes);
    const buffer = Buffer.from(await file.arrayBuffer());
    let info;
    try { info = await sharp(buffer, { limitInputPixels: 40_000_000 }).metadata(); }
    catch { throw new AppError(ErrorCode.VALIDATION_ERROR, "invalidFile"); }
    if (!["jpeg", "png", "webp"].includes(info.format ?? "") || !info.width || !info.height) throw new AppError(ErrorCode.VALIDATION_ERROR, "invalidFile");
    const mime = `image/${info.format}`;
    const path = `${uid}/${randomUUID()}-${createSafeFilename(`${parse(file.name).name.slice(0, 80)}.${info.format}`)}`;
    const supabase = getSupabaseServerClient();
    try {
      const existing = await supabase.storage.getBucket(this.bucket);
      if (existing.data && !existing.data.public) throw new AppError(ErrorCode.STORAGE_ERROR, "Media bucket must allow public reads.");
      if (existing.error) {
        if (String(existing.error.statusCode) !== "404") throw existing.error;
        const created = await supabase.storage.createBucket(this.bucket, { public: true, allowedMimeTypes: IMAGE_TYPES, fileSizeLimit: DEFAULT_IMAGE_BYTES });
        if (created.error && created.error.message !== "The resource already exists") throw created.error;
      }
      const storage = supabase.storage.from(this.bucket);
      const upload = await storage.upload(path, buffer, { contentType: mime, cacheControl: "31536000", upsert: false });
      if (upload.error) {
        if (String(upload.error.statusCode) === "413" || upload.error.message.toLowerCase().includes("maximum allowed size")) {
          throw new ImageTooLargeError(await new MediaPolicyRepository().getLimit());
        }
        throw upload.error;
      }
      const url = storage.getPublicUrl(path).data.publicUrl;
      const reference = getAdminDb().collection("media").doc();
      const asset = { name: file.name.slice(0, 180), url, path, bytes: buffer.length, width: info.width, height: info.height };
      try { await reference.create({ ...asset, createdAt: FieldValue.serverTimestamp(), createdBy: uid }); }
      catch (error) {
        const cleanup = await storage.remove([path]);
        if (cleanup.error) logger.error("Media cleanup failed.", { code: "STORAGE_ERROR" });
        throw error;
      }
      return { ...asset, id: reference.id, createdAt: new Date().toISOString() };
    } catch (error) { throw normalizeError(error, ErrorCode.STORAGE_ERROR); }
  }
  async delete(id: string) {
    try {
      const db = getAdminDb();
      const reference = db.doc(`media/${id}`);
      const current = await reference.get();
      if (!current.exists) throw new AppError(ErrorCode.NOT_FOUND, "Media not found.");
      const data = current.data()!;
      const [products, site] = await Promise.all([
        db.collection("products").where("images", "array-contains", data.url).limit(1).get(), db.doc("siteContent/main").get(),
      ]);
      if (!products.empty || containsUrl(site.data(), data.url)) throw new AppError(ErrorCode.VALIDATION_ERROR, "imageInUse");
      const removed = await getSupabaseServerClient().storage.from(this.bucket).remove([data.path]);
      if (removed.error) throw removed.error;
      await reference.delete();
    } catch (error) { throw normalizeError(error, ErrorCode.STORAGE_ERROR); }
  }
}
