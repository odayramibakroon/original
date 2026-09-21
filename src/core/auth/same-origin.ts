export function isSameOrigin(request: Pick<Request, "url" | "headers">): boolean {
  const raw = request.headers.get("origin");
  if (!raw) return false;
  try {
    const origin = new URL(raw);
    const target = new URL(request.url);
    // Next normalizes loopback URLs to localhost; Host retains the requested host.
    const host = request.headers.get("host") ?? target.host;
    return origin.origin === raw && origin.host === host && origin.protocol === target.protocol;
  } catch { return false; }
}
