import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/**
 * Favicon gerado a partir do lockup tipográfico, não de um logo — o DESIGN.md
 * proíbe redesenhar a marca, e os ficheiros originais ainda não existem.
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#15100b",
        color: "#f7f0e3",
        fontSize: 300,
        fontWeight: 700,
        fontFamily: "serif",
        letterSpacing: "-0.02em",
        border: "16px solid #a3651f",
      }}
    >
      R
    </div>,
    size,
  );
}
