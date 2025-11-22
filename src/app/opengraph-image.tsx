import { ImageResponse } from "next/og";

export const alt = "Malik Tech Dairy & Cattle Management";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(135deg, #1F7A3D 0%, #155a2d 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 20 }}>🐄</div>
        <div style={{ fontSize: 48, fontWeight: "bold" }}>Malik Tech Dairy</div>
        <div style={{ fontSize: 32, marginTop: 10, opacity: 0.9 }}>
          Empowering Dairy Farms with Technology
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

