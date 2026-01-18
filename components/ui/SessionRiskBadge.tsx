"use client";

export function SessionRiskBadge({ score }: { score: number }) {
  const level = score > 70 ? "high" : score > 40 ? "medium" : "low";
  return <span className={`risk-badge risk-badge--${level}`}>Risk {score}</span>;
}
