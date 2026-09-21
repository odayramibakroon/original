import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/core/auth/session";
import { isSameOrigin } from "@/core/auth/same-origin";
import { AppError, ErrorCode, normalizeError } from "@/core/errors";
import { MediaRepository } from "@/features/media/infrastructure/media-repository";
import { MediaPolicyRepository } from "@/features/media/infrastructure/media-policy-repository";
import { ImageTooLargeError } from "@/features/media/domain/upload-limit";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const t = await getTranslations("cms");
  try {
    if (!isSameOrigin(request)) return Response.json({ message: t("error") }, { status: 403 });
    const admin = await requireAdmin();
    const limit = await new MediaPolicyRepository().getLimit();
    if (Number(request.headers.get("content-length")) > limit + 100000) throw new ImageTooLargeError(limit);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ message: t("invalidFile") }, { status: 400 });
    return Response.json({ asset: await new MediaRepository().upload(file, admin.uid) });
  } catch (error) {
    if (error instanceof ImageTooLargeError) return Response.json({ message: t("imageTooLarge", { size: Math.floor(error.maxBytes / 1024) }), maxBytes: error.maxBytes }, { status: 413 });
    const normalized = normalizeError(error);
    logger.error("Image upload failed.", { code: normalized.code });
    const status = [ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN].includes(normalized.code) ? 403 : 400;
    return Response.json({ message: t(error instanceof AppError && error.message === "invalidFile" ? "invalidFile" : "error") }, { status });
  }
}
