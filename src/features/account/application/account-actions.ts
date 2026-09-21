"use server";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/core/auth/session";
import { SessionRegistry } from "@/core/auth/session-registry";
import { logger } from "@/core/logger";
import { normalizeError } from "@/core/errors";

export async function signOutOtherDevices() {
  const t = await getTranslations("account");
  try {
    await new SessionRegistry().revokeOthers(await requireAdmin());
    return { ok: true, message: t("othersSignedOut") };
  } catch (error) {
    logger.error("Could not revoke other devices.", { code: normalizeError(error).code });
    return { ok: false, message: t("error") };
  }
}
