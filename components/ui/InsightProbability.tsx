"use client";

export function InsightProbability({ level }: { level: "likely" | "possible" | "unlikely" }) {
  return <span className={`insight-prob insight-prob--${level}`}>{level}</span>;
}
