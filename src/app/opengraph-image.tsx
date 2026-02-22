import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RunHouse Custom - Create Your Crew's Identity";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "72px",
        background:
          "linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 45%, rgb(14, 116, 144) 100%)",
        color: "white",
      }}
    >
      <div
        style={{
          fontSize: 34,
          letterSpacing: 2,
          opacity: 0.9,
          marginBottom: 18,
        }}
      >
        RUNHOUSECUSTOM
      </div>
      <div
        style={{
          fontSize: 66,
          fontWeight: 700,
          lineHeight: 1.08,
          maxWidth: "90%",
        }}
      >
        Create Your Crew&apos;s Identity
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 30,
          opacity: 0.9,
        }}
      >
        Premium custom running gear
      </div>
    </div>,
    size,
  );
}
