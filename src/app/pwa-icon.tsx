import { ImageResponse } from "next/og";

type ParentIconOptions = {
  size: 192 | 512;
  maskable?: boolean;
};

export function createParentPwaIcon({ size, maskable = false }: ParentIconOptions) {
  const padding = maskable ? Math.round(size * 0.12) : Math.round(size * 0.1);
  const borderRadius = Math.round(size * 0.2);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #1A237E 0%, #283593 100%)",
          color: "#E8EAF6",
          fontFamily: "Arial, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: padding,
            borderRadius,
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(232, 234, 246, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={Math.round(size * 0.62)}
            height={Math.round(size * 0.62)}
            viewBox="0 0 64 64"
            fill="none"
          >
            <rect width="64" height="64" rx="12" fill="#1A237E" />
            <path d="M16 48V28l16-10 16 10v20h-8V38H24v10h-8z" fill="#E8EAF6" />
            <path d="M20 36l12-8 12 8" fill="none" stroke="#C5CAE9" strokeWidth="2" />
            <path d="M28 48v-8h8v8" fill="none" stroke="#C5CAE9" strokeWidth="2" />
            <path d="M14 30l18-12 18 12" fill="none" stroke="#C5CAE9" strokeWidth="2" />
          </svg>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    },
  );
}
