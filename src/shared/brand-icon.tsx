import { ImageResponse } from "next/og";

export function brandIcon(size: number) {
  return new ImageResponse(
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#ee8a27", color: "#171310", fontSize: size * .38, fontWeight: 900 }}>SF</div>,
    { width: size, height: size },
  );
}
