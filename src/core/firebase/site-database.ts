import type { Firestore } from "firebase-admin/firestore";

export const SITE_DOCUMENT_PATH = "websites/originalcompany";
export type SiteDatabase = Pick<Firestore, "collection" | "doc" | "runTransaction" | "batch" | "bulkWriter" | "terminate">;

// Keep this standalone website out of the existing application's root collections.
export function siteDatabase(db: Firestore): SiteDatabase {
  return {
    collection: (path) => db.collection(`${SITE_DOCUMENT_PATH}/${path}`),
    doc: (path) => db.doc(`${SITE_DOCUMENT_PATH}/${path}`),
    runTransaction: db.runTransaction.bind(db),
    batch: db.batch.bind(db),
    bulkWriter: db.bulkWriter.bind(db),
    terminate: db.terminate.bind(db),
  };
}
