import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sweets Factory", short_name: "Factory", start_url: "/admin/messages", scope: "/",
    display: "standalone", background_color: "#ffffff", theme_color: "#ee8a27",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
