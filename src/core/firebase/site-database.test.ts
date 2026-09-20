import { expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { siteDatabase, SITE_DOCUMENT_PATH } from "./site-database";

it("scopes all data paths while retaining SDK transaction and writer bindings", () => {
  const raw = {
    doc: vi.fn(), collection: vi.fn(),
    runTransaction: vi.fn(function (this: unknown) { return this; }),
    batch: vi.fn(function (this: unknown) { return this; }),
    bulkWriter: vi.fn(), terminate: vi.fn(),
  };
  const db = siteDatabase(raw as unknown as Firestore);
  db.doc("users/account"); db.collection("products");
  expect(raw.doc).toHaveBeenCalledWith(`${SITE_DOCUMENT_PATH}/users/account`);
  expect(raw.collection).toHaveBeenCalledWith(`${SITE_DOCUMENT_PATH}/products`);
  expect(db.batch()).toBe(raw);
  expect(db.runTransaction(async () => true)).toBe(raw);
});
