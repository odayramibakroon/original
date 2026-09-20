import "server-only";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/core/auth/session";
import { AppError, ErrorCode } from "@/core/errors";
import { logger } from "@/core/logger";

export async function authorizeAdminPage(path: string) {
  try {
    return await requireAdmin();
  } catch (error) {
    unstable_rethrow(error);
    if (!(error instanceof AppError) || ![ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN].includes(error.code)) {
      logger.error("Admin authorization unavailable.", { error: error instanceof Error ? error.name : "unknown" });
    }
  }
  redirect(`/login?next=${encodeURIComponent(path)}`);
}
