import "server-only";
import { unstable_cache } from "next/cache";
import { isAdminConfigured } from "@/core/firebase/admin";
import { SITE_DOCUMENT_PATH } from "@/core/firebase/site-database";
import { defaultSiteDocument } from "../data/default-site-document";
import { SiteRepository } from "../infrastructure/site-repository";

const readSite = unstable_cache(() => new SiteRepository().get(), [SITE_DOCUMENT_PATH, "public-site"], { tags: ["site"], revalidate: 60 });
export function getPublicSite() { return isAdminConfigured() ? readSite() : Promise.resolve(defaultSiteDocument()); }
