import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "NearLeadsQ — local business leads, emails and WhatsApp outreach";

const logoDataUri = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "logo-square.png")
).toString("base64")}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          background: "linear-gradient(135deg, #0b1120 0%, #172554 100%)",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image is not available inside next/og */}
          <img
            src={logoDataUri}
            width={96}
            height={96}
            alt="NearLeadsQ logo"
            style={{ borderRadius: 20 }}
          />
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -2 }}>NearLeadsQ</div>
        </div>
        <div style={{ display: "flex", maxWidth: 900, textAlign: "center", fontSize: 34 }}>
          Find local businesses missing websites, emails — then start WhatsApp chats in one click.
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#93c5fd" }}>
          nearleadsq.app · Free to start, no credit card
        </div>
      </div>
    ),
    size
  );
}
