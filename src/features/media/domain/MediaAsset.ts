export type MediaAsset = { id: string; name: string; url: string; path: string; bytes: number; width: number; height: number; createdAt: string };
export const DEFAULT_IMAGE_BYTES = 500 * 1024;
// Keep multipart requests below the hosting provider's 4.5 MB payload ceiling.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
