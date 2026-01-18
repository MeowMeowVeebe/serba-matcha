"use client";

import type { CSSProperties } from "react";

type Props = {
  height?: number;
  width?: string | number;
  radius?: number;
  style?: CSSProperties;
};

export default function SkeletonBlock({ height = 14, width = "100%", radius = 10, style }: Props) {
  return (
    <div
      aria-hidden
      style={{
        height,
        width,
        borderRadius: radius,
        background: "linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 37%, rgba(0,0,0,0.06) 63%)",
        backgroundSize: "400% 100%",
        animation: "rovodevSkeleton 1.1s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
