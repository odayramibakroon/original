import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/core/auth/session";
import { AppError, ErrorCode, normalizeError } from "@/core/errors";
import { MediaRepository } from "@/features/media/infrastructure/media-repository";
import { MAX_IMAGE_BYTES } from "@/features/media/domain/MediaAsset";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const t = await getTranslations("cms");
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ message: t("error") }, { status: 403 });
    const admin = await requireAdmin();
    if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES + 100000) return Response.json({ message: t("invalidFile") }, { status: 413 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ message: t("invalidFile") }, { status: 400 });
    return Response.json({ asset: await new MediaRepository().upload(file, admin.uid) });
  } catch (error) {
    const normalized = normalizeError(error);
    logger.error("Image upload failed.", { code: normalized.code });
    const status = [ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN].includes(normalized.code) ? 403 : 400;
    return Response.json({ message: t(error instanceof AppError && error.message === "invalidFile" ? "invalidFile" : "error") }, { status });
  }
}
