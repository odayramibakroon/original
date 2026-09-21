// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getBucket: vi.fn(), updateBucket: vi.fn(), createBucket: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/core/supabase/server", () => ({ getSupabaseServerClient: () => ({ storage: mocks }) }));
import { MediaPolicyRepository } from "./media-policy-repository";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getBucket.mockResolvedValue({ data: { public: true, file_size_limit: 512000 }, error: null });
  mocks.updateBucket.mockResolvedValue({ error: null });
});
it("reads the live bucket limit with a 500 KB default for missing buckets", async () => {
  expect(await new MediaPolicyRepository().getLimit()).toBe(512000);
  mocks.getBucket.mockResolvedValue({ error: { statusCode: "404" } });
  expect(await new MediaPolicyRepository().getLimit()).toBe(512000);
  expect(mocks.createBucket).not.toHaveBeenCalled();
});
it("changes the bucket limit without changing MIME restrictions or public access", async () => {
  await new MediaPolicyRepository().saveLimit({ maxImageKb: 250 });
  expect(mocks.updateBucket).toHaveBeenCalledWith("site-media", { public: true, fileSizeLimit: 256000 });
});
it("rejects invalid limits and cannot expose a private bucket", async () => {
  await expect(new MediaPolicyRepository().saveLimit({ maxImageKb: 5000 })).rejects.toThrow();
  mocks.getBucket.mockResolvedValue({ data: { public: false, file_size_limit: 512000 }, error: null });
  await expect(new MediaPolicyRepository().saveLimit({ maxImageKb: 250 })).rejects.toThrow();
  expect(mocks.updateBucket).not.toHaveBeenCalled();
});
it("does not report success when the storage update fails", async () => {
  mocks.updateBucket.mockResolvedValue({ error: new Error("Storage rejected update") });
  await expect(new MediaPolicyRepository().saveLimit({ maxImageKb: 250 })).rejects.toThrow();
});
