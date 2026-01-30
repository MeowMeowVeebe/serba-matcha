"use client";

export function DynamicMoodGradient({ mood }: { mood: "growth" | "stable" | "risk" }) {
  return <div className={`mood-gradient mood-gradient--${mood}`} aria-hidden />;
}
