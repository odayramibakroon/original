import { beforeEach, expect, it, vi } from "vitest";
import { seedProducts } from "@/features/products/data/seed-products";

const mocks = vi.hoisted(() => ({ getAll: vi.fn(), create: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/core/firebase/admin", () => ({ getAdminDb: () => ({
  doc: (path: string) => ({ path }),
  runTransaction: (operation: (transaction: unknown) => unknown) => operation(mocks),
}) }));
import { importOriginalContent } from "./import-original-content";

beforeEach(() => { vi.clearAllMocks(); });

it("imports the original catalog and site atomically", async () => {
  mocks.getAll.mockResolvedValue(Array.from({ length: 2 + seedProducts.length * 2 }, () => ({ exists: false })));
  expect(await importOriginalContent("bootstrap:service-account")).toEqual({ alreadyImported: false, createdSite: true, createdProducts: 4 });
  expect(mocks.create).toHaveBeenCalledTimes(10);
  expect(mocks.create).toHaveBeenCalledWith({ path: "siteContent/main" }, expect.objectContaining({ updatedBy: "bootstrap:service-account" }));
});

it("never overwrites existing site content, products or reserved slugs", async () => {
  const documents = Array.from({ length: 2 + seedProducts.length * 2 }, () => ({ exists: false }));
  documents[1].exists = true;
  documents[2].exists = true;
  documents[3 + seedProducts.length].exists = true;
  mocks.getAll.mockResolvedValue(documents);
  expect(await importOriginalContent("admin")).toEqual({ alreadyImported: false, createdSite: false, createdProducts: 2 });
  expect(mocks.create).not.toHaveBeenCalledWith({ path: "siteContent/main" }, expect.anything());
});

it("is idempotent after an import has completed", async () => {
  mocks.getAll.mockResolvedValue([{ exists: true }, { exists: true }]);
  expect((await importOriginalContent("admin")).alreadyImported).toBe(true);
  expect(mocks.create).not.toHaveBeenCalled();
});
