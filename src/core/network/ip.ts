import { isIP } from "node:net";
import ipaddr from "ipaddr.js";

export function normalizeIp(value: string): string | null {
  const ip = value.trim();
  if (!isIP(ip) || ip.includes("%")) return null;
  return ipaddr.process(ip).toString();
}

export function resolveClientIp(headers: Pick<Headers, "get">, env: NodeJS.ProcessEnv): string | null {
  if (env.VERCEL === "1") return normalizeIp(headers.get("x-vercel-forwarded-for") ?? "");
  const trusted = env.CONTACT_TRUSTED_IP_HEADER;
  if (trusted && ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"].includes(trusted)) {
    // The trusted ingress must overwrite this header with a single address.
    return normalizeIp(headers.get(trusted) ?? "");
  }
  return env.NODE_ENV !== "production" ? "127.0.0.1" : null;
}
