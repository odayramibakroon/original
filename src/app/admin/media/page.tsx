import { getTranslations } from "next-intl/server";
import { authorizeAdminPage } from "@/features/admin/application/authorize-page";
import { AdminUnavailable } from "@/features/admin/presentation/AdminUnavailable";
import { MediaLibrary } from "@/features/media/presentation/MediaLibrary";
import { MediaRepository } from "@/features/media/infrastructure/media-repository";
import { MediaPolicyRepository } from "@/features/media/infrastructure/media-policy-repository";
import { logger } from "@/core/logger";

export default async function Media() {
  await authorizeAdminPage("/admin/media");
  let images;
  let maxBytes;
  try { [images, maxBytes] = await Promise.all([new MediaRepository().list(), new MediaPolicyRepository().getLimit()]); }
  catch { logger.error("Could not load media library."); return <AdminUnavailable />; }
  return <><h1>{(await getTranslations("cms"))("media")}</h1><MediaLibrary initial={images} maxBytes={maxBytes} /></>;
}
