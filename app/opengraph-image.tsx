import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Oficina Rassë — gravação em madeira e impressão 3D";

/** Imagem Open Graph por padrão, para as páginas sem imagem própria. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: "#15100b",
        fontFamily: "serif",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: "1px solid #a3651f",
          display: "flex",
        }}
      />
      <div
        style={{
          fontSize: 22,
          letterSpacing: "0.28em",
          color: "#8d8781",
          textTransform: "uppercase",
          fontFamily: "sans-serif",
        }}
      >
        Oficina · Ateliê · Estúdio
      </div>
      <div style={{ fontSize: 128, fontWeight: 700, color: "#f7f0e3", letterSpacing: "0.06em" }}>
        RASSË
      </div>
      <div style={{ width: 48, height: 1, background: "#a3651f", display: "flex" }} />
      <div style={{ fontSize: 30, color: "#e6d6bc" }}>Gravação em madeira. Impressão 3D.</div>
    </div>,
    size,
  );
}
