import "server-only";
import { getSupabaseServerClient } from "@/core/supabase/server";
import { AppError, ErrorCode, normalizeError } from "@/core/errors";
import { DEFAULT_IMAGE_BYTES, IMAGE_TYPES } from "../domain/MediaAsset";
import { effectiveImageLimit, uploadLimitSchema } from "../domain/upload-limit";

export class MediaPolicyRepository {
  private bucket = process.env.SUPABASE_MEDIA_BUCKET || "site-media";
  async getLimit() {
    try {
      const { data, error } = await getSupabaseServerClient().storage.getBucket(this.bucket);
      if (error) {
        if (String(error.statusCode) === "404") return DEFAULT_IMAGE_BYTES;
        throw error;
      }
      if (!data?.public) throw new AppError(ErrorCode.STORAGE_ERROR, "Media bucket must allow public reads.");
      return effectiveImageLimit(data.file_size_limit);
    } catch (error) { throw normalizeError(error, ErrorCode.STORAGE_ERROR); }
  }
  async saveLimit(input: unknown) {
    const { maxImageKb } = uploadLimitSchema.parse(input);
    try {
      const storage = getSupabaseServerClient().storage;
      const current = await storage.getBucket(this.bucket);
      const limit = maxImageKb * 1024;
      if (current.error && String(current.error.statusCode) !== "404") throw current.error;
      if (current.data && !current.data.public) throw new AppError(ErrorCode.STORAGE_ERROR, "Media bucket must allow public reads.");
      const result = current.data
        ? await storage.updateBucket(this.bucket, { public: current.data.public, fileSizeLimit: limit })
        : await storage.createBucket(this.bucket, { public: true, fileSizeLimit: limit, allowedMimeTypes: IMAGE_TYPES });
      if (result.error) throw result.error;
      return this.getLimit();
    } catch (error) { throw normalizeError(error, ErrorCode.STORAGE_ERROR); }
  }
}
