import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RunHouse Custom — Your Crew's Own Store";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 디스플레이 페이스(Anton) — 앱 히어로/가이드의 uppercase 디스플레이 결
const ANTON_TTF =
  "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf";

const INK = "#0B0C0A";
const LIME = "#C7FF00";

export default async function OpenGraphImage() {
  let anton: ArrayBuffer | null = null;
  try {
    const res = await fetch(ANTON_TTF);
    if (res.ok) anton = await res.arrayBuffer();
  } catch {
    anton = null;
  }

  const display = anton ? "Anton" : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: INK,
          color: "#F5F5F0",
          position: "relative",
          padding: "80px",
        }}
      >
        {/* 카토그래픽 그리드 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* 라임 글로우 (blur 대신 radial) */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 620,
            height: 620,
            display: "flex",
            background:
              "radial-gradient(circle, rgba(199,255,0,0.20) 0%, rgba(199,255,0,0) 68%)",
          }}
        />

        {/* 키커 */}
        <div
          style={{
            display: "flex",
            fontFamily: display,
            fontSize: 30,
            letterSpacing: 8,
            color: LIME,
            marginBottom: 26,
          }}
        >
          · CREW STORE · CREW GEAR ·
        </div>

        {/* 타이틀 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: display,
            fontSize: 116,
            lineHeight: 1,
            letterSpacing: 1,
          }}
        >
          <span style={{ color: "#F5F5F0" }}>YOUR CREW&apos;S</span>
          <span style={{ color: LIME }}>OWN STORE</span>
        </div>

        {/* 서브카피 */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#B9BCB3",
            marginTop: 30,
          }}
        >
          One link — from crew gear to bulk order.
        </div>

        {/* 로고 락업 */}
        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 64,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: display,
              fontSize: 34,
              letterSpacing: 3,
              color: "#F5F5F0",
            }}
          >
            RUN HOUSE
          </span>
          <span
            style={{
              display: "flex",
              marginLeft: 14,
              padding: "8px 14px",
              background: LIME,
              color: INK,
              fontFamily: display,
              fontSize: 20,
              letterSpacing: 3,
              borderRadius: 6,
            }}
          >
            CUSTOM
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: anton
        ? [{ name: "Anton", data: anton, weight: 400, style: "normal" }]
        : [],
    },
  );
}
