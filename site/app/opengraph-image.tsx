import { ImageResponse } from "next/og";

export const alt = "CreditWise — Compare the Best Credit Cards";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontStyle: "italic",
            fontWeight: 700,
            color: "#38bdf8",
          }}
        >
          CreditWise
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 40,
            lineHeight: 1.3,
            color: "#e2e8f0",
            maxWidth: 900,
          }}
        >
          Compare rewards, fees, APR, and benefits across the best credit cards —
          based on your real spending.
        </div>
      </div>
    ),
    { ...size }
  );
}
