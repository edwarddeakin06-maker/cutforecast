import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 72, color: "white", background: "linear-gradient(135deg, #08131a 0%, #0b1722 52%, #0b3228 100%)" }}>
        <div style={{ display: "flex", fontSize: 30, color: "#6ee7b7", letterSpacing: 5, textTransform: "uppercase" }}>CutForecast</div>
        <div style={{ display: "flex", marginTop: 28, maxWidth: 900, fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>Your cutting plan, made clear.</div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 32, color: "#cbd5e1" }}>Calories · Macros · Goal date · Weekly progress</div>
        <div style={{ display: "flex", marginTop: 54, height: 18, width: 700, borderRadius: 999, background: "linear-gradient(90deg, #34d399, #38bdf8)" }} />
      </div>
    ),
    size,
  );
}
