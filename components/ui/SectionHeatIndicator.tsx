"use client";

export function SectionHeatIndicator({ label, level }: { label: string; level: "low" | "medium" | "high" }) {
  return (
    <div className="section-heat">
      <span>{label}</span>
      <span className={`section-heat__badge section-heat__badge--${level}`}>{level}</span>
    </div>
  );
}
