"use client";

export function SmartSkeleton({ variant = "card" }: { variant?: "card" | "table" | "form" }) {
  return (
    <div className={`smart-skeleton smart-skeleton--${variant}`} aria-hidden>
      <div className="smart-skeleton__line" />
      <div className="smart-skeleton__line" />
      <div className="smart-skeleton__line" />
    </div>
  );
}
