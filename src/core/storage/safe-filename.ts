export function createSafeFilename(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "bin";
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "file"}-${Date.now()}.${extension}`;
}
