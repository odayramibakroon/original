import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    return [{ source: "/sw.js", headers: [
      { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      { key: "Service-Worker-Allowed", value: "/" },
      { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
    ] }];
  },
  images: {
    dangerouslyAllowLocalIP: process.env.NEXT_DIST_DIR === ".next-e2e",
    remotePatterns: [
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL ? [{ protocol: "https" as const, hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, pathname: "/storage/v1/object/public/**" }] : []),
      ...(process.env.NEXT_DIST_DIR === ".next-e2e" ? [{ protocol: "http" as const, hostname: "127.0.0.1", port: "54329", pathname: "/storage/v1/object/public/**" }] : []),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
    ],
  },
};

export default createNextIntlPlugin("./src/core/i18n/request.ts")(nextConfig);
