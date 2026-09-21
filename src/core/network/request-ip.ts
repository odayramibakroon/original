import "server-only";
import { headers } from "next/headers";
import { AppError, ErrorCode } from "@/core/errors";
import { resolveClientIp } from "./ip";

export async function getRequestIp() {
  const ip = resolveClientIp(await headers(), process.env);
  if (!ip) throw new AppError(ErrorCode.NETWORK_ERROR, "Trusted client IP is unavailable.");
  return ip;
}
