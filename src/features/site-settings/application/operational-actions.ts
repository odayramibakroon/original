"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { adminAction } from "@/core/auth/admin-action";
import { ContactPolicyRepository } from "@/features/contact/infrastructure/contact-policy-repository";
import { contactPolicySchema } from "@/features/contact/domain/contact-policy";
import { MediaPolicyRepository } from "@/features/media/infrastructure/media-policy-repository";
import { logger } from "@/core/logger";

export async function saveContactPolicy(input: unknown) {
  return adminAction(async (admin) => {
    await new ContactPolicyRepository().save(contactPolicySchema.parse(input), admin.uid);
    revalidatePath("/admin/settings");
  });
}
export async function setContactIpBlocked(input: unknown) {
  return adminAction(async (admin) => {
    const { ip, blocked } = z.object({ ip: z.string().trim().min(2).max(45), blocked: z.boolean() }).parse(input);
    await new ContactPolicyRepository().setBlocked(ip, blocked, admin.uid);
    revalidatePath("/admin/settings"); revalidatePath("/admin/messages", "layout");
  });
}
export async function saveMediaLimit(input: unknown) {
  return adminAction(async (admin) => {
    const maxBytes = await new MediaPolicyRepository().saveLimit(input);
    logger.info("Media upload limit updated.", { uid: admin.uid, maxBytes });
    revalidatePath("/admin/settings"); revalidatePath("/admin/media");
    return maxBytes;
  });
}
