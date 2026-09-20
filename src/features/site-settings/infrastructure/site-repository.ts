import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/firebase/admin";
import { normalizeError, ErrorCode } from "@/core/errors";
import { defaultSiteDocument } from "../data/default-site-document";
import { siteSectionNames, siteSectionSchemas, type SiteDocument, type SiteSection } from "../domain/site-schema";

export class SiteRepository {
  async get(): Promise<SiteDocument> {
    try {
      const snapshot = await getAdminDb().doc("siteContent/main").get();
      const defaults = defaultSiteDocument();
      const data = snapshot.data();
      if (!data) return defaults;
      return Object.fromEntries(siteSectionNames.map((section) => [section,
        siteSectionSchemas[section].parse(data[section] ?? defaults[section]),
      ])) as SiteDocument;
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
  async saveSection(section: SiteSection, value: SiteDocument[SiteSection], uid: string) {
    try {
      await getAdminDb().doc("siteContent/main").set({ [section]: value,
        updatedAt: FieldValue.serverTimestamp(), updatedBy: uid,
      }, { mergeFields: [section, "updatedAt", "updatedBy"] });
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
}
