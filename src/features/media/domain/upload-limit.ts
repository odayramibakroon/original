import { z } from "zod";
import { AppError, ErrorCode } from "@/core/errors";
import { DEFAULT_IMAGE_BYTES, MAX_IMAGE_BYTES } from "./MediaAsset";

export const uploadLimitSchema = z.object({ maxImageKb: z.number().int().min(1).max(MAX_IMAGE_BYTES / 1024) });
export function effectiveImageLimit(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.min(Math.floor(value), MAX_IMAGE_BYTES) : DEFAULT_IMAGE_BYTES;
}
export class ImageTooLargeError extends AppError {
  constructor(readonly maxBytes: number) { super(ErrorCode.VALIDATION_ERROR, "imageTooLarge"); }
}
