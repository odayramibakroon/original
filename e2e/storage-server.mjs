import { createServer } from "node:http";

// Local Storage API fixture: browser tests must never mutate the real bucket.
let limit = 500 * 1024;
const objects = new Map();
createServer(async (request, response) => {
  const path = new URL(request.url, "http://127.0.0.1").pathname;
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  const json = (data, status = 200) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));
  };
  if (path === "/health") return json({ ok: true });
  if (path === "/reset" && request.method === "POST") { limit = 512000; objects.clear(); return json({ ok: true }); }
  if (path === "/storage/v1/bucket/site-media") {
    if (request.method === "PUT") limit = JSON.parse(bytes.toString()).file_size_limit;
    return json({ id: "site-media", name: "site-media", public: true, file_size_limit: limit, allowed_mime_types: ["image/jpeg", "image/png", "image/webp"] });
  }
  const publicPrefix = "/storage/v1/object/public/site-media/";
  if (path.startsWith(publicPrefix)) {
    const object = objects.get(decodeURIComponent(path.slice(publicPrefix.length)));
    if (!object) return json({ message: "Not found" }, 404);
    response.writeHead(200, { "Content-Type": object.type }); response.end(object.bytes); return;
  }
  const prefix = "/storage/v1/object/site-media/";
  if (path.startsWith(prefix) && request.method === "POST") {
    if (bytes.length > limit) return json({ statusCode: "413", error: "PayloadTooLarge", message: "The object exceeded the maximum allowed size" }, 413);
    const key = decodeURIComponent(path.slice(prefix.length));
    objects.set(key, { bytes, type: request.headers["content-type"] || "image/png" });
    return json({ Key: `site-media/${key}` });
  }
  if (path === "/storage/v1/object/site-media" && request.method === "DELETE") {
    const { prefixes } = JSON.parse(bytes.toString());
    for (const key of prefixes) objects.delete(key);
    return json(prefixes.map((name) => ({ name })));
  }
  return json({ message: "Unsupported fixture request" }, 404);
}).listen(54329, "127.0.0.1");
