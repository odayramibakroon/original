import { authorizeAdminPage } from "@/features/admin/application/authorize-page";
import { AdminUnavailable } from "@/features/admin/presentation/AdminUnavailable";
import { ContactPolicyRepository } from "@/features/contact/infrastructure/contact-policy-repository";
import { MediaPolicyRepository } from "@/features/media/infrastructure/media-policy-repository";
import { logger } from "@/core/logger";
import { OperationalSettings } from "./OperationalSettings";

export async function OperationalSettingsPage() {
  await authorizeAdminPage("/admin/settings");
  let settings;
  try {
    const repository = new ContactPolicyRepository();
    const [policy, blocked, maxBytes] = await Promise.all([
      repository.get(), repository.blocked(), new MediaPolicyRepository().getLimit().catch(() => { logger.warn("Media settings unavailable."); return null; }),
    ]);
    settings = { policy, blocked, maxBytes };
  } catch { logger.error("Could not load operational settings."); return <AdminUnavailable />; }
  return <OperationalSettings {...settings} />;
}
