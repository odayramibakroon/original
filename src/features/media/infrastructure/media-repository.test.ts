// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import sharp from "sharp";
import { MAX_IMAGE_BYTES } from "../domain/MediaAsset";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(), remove: vi.fn(), getBucket: vi.fn(), createBucket: vi.fn(),
  create: vi.fn(), delete: vi.fn(), get: vi.fn(), references: vi.fn(), site: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/core/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/core/supabase/server", () => ({ getSupabaseServerClient: () => ({ storage: {
  getBucket: mocks.getBucket, createBucket: mocks.createBucket,
  from: () => ({ upload: mocks.upload, remove: mocks.remove,
    getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.example.test/${path}` } }),
  }),
} }) }));
vi.mock("@/core/firebase/admin", () => ({ getAdminDb: () => ({
  collection: () => ({ doc: () => ({ id: "image-id", create: mocks.create }),
    where: () => ({ limit: () => ({ get: mocks.references }) }),
  }),
  doc: (path: string) => path === "siteContent/main" ? { get: mocks.site } : { get: mocks.get, delete: mocks.delete },
}) }));

import { MediaRepository } from "./media-repository";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getBucket.mockResolvedValue({ error: null });
  mocks.createBucket.mockResolvedValue({ error: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.create.mockResolvedValue(undefined);
  mocks.get.mockResolvedValue({ exists: true, data: () => ({ url: "https://storage.example.test/image.png", path: "admin/image.png" }) });
  mocks.references.mockResolvedValue({ empty: true });
  mocks.site.mockResolvedValue({ data: () => ({}) });
});

async function validImage() {
  const bytes = await sharp({ create: { width: 2, height: 3, channels: 3, background: "white" } }).png().toBuffer();
  return new File([new Uint8Array(bytes)], "product.png", { type: "image/png" });
}

it("rejects oversized and disguised non-images before touching storage", async () => {
  const repository = new MediaRepository();
  await expect(repository.upload(new File(["not a png"], "fake.png", { type: "image/png" }), "admin")).rejects.toMatchObject({ message: "invalidFile" });
  await expect(repository.upload(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.png", { type: "image/png" }), "admin")).rejects.toMatchObject({ message: "invalidFile" });
  expect(mocks.upload).not.toHaveBeenCalled();
});

it("stores a validated image and its dimensions with a unique path", async () => {
  const asset = await new MediaRepository().upload(await validImage(), "admin");
  expect(asset).toMatchObject({ id: "image-id", width: 2, height: 3, name: "product.png" });
  expect(asset.path).toMatch(/^admin\/[a-f0-9-]+-product-\d+\.png$/);
  expect(mocks.upload).toHaveBeenCalledWith(asset.path, expect.any(Buffer), expect.objectContaining({ upsert: false, contentType: "image/png" }));
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ createdBy: "admin", url: asset.url }));
});

it("removes an uploaded file if saving metadata fails", async () => {
  mocks.create.mockRejectedValue(new Error("Database unavailable"));
  await expect(new MediaRepository().upload(await validImage(), "admin")).rejects.toThrow();
  expect(mocks.remove).toHaveBeenCalledWith([mocks.upload.mock.calls[0][0]]);
});

it("does not delete images referenced by a product or nested site content", async () => {
  mocks.references.mockResolvedValueOnce({ empty: false });
  await expect(new MediaRepository().delete("image-id")).rejects.toMatchObject({ message: "imageInUse" });
  mocks.site.mockResolvedValue({ data: () => ({ hero: { desktopImage: "https://storage.example.test/image.png" } }) });
  await expect(new MediaRepository().delete("image-id")).rejects.toMatchObject({ message: "imageInUse" });
  expect(mocks.remove).not.toHaveBeenCalled();
  expect(mocks.delete).not.toHaveBeenCalled();
});

it("only removes metadata after storage deletion succeeds", async () => {
  mocks.remove.mockResolvedValueOnce({ error: new Error("Storage unavailable") });
  await expect(new MediaRepository().delete("image-id")).rejects.toThrow();
  expect(mocks.delete).not.toHaveBeenCalled();
  await new MediaRepository().delete("image-id");
  expect(mocks.delete).toHaveBeenCalledOnce();
});
