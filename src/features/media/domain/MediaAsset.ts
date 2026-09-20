export type MediaAsset = { id: string; name: string; url: string; path: string; bytes: number; width: number; height: number; createdAt: string };
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
