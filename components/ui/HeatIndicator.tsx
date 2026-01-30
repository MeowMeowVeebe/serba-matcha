"use client";

export function HeatIndicator({ level }: { level: "low" | "medium" | "high" }) {
  return <span className={`heat-indicator heat-indicator--${level}`}>{level}</span>;
}
