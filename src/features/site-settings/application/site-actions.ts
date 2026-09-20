"use server";
import { updateTag, revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/core/auth/admin-action";
import { siteSectionSchemas, siteSectionNames } from "../domain/site-schema";
import { SiteRepository } from "../infrastructure/site-repository";

export async function saveSiteSection(section: unknown, input: unknown) {
  return adminAction(async (admin) => {
    const key = z.enum(siteSectionNames).parse(section);
    await new SiteRepository().saveSection(key, siteSectionSchemas[key].parse(input), admin.uid);
    updateTag("site"); revalidatePath("/", "layout");
  });
}
