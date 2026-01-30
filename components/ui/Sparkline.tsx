"use client";

export function Sparkline({ values }: { values: number[] }) {
  return (
    <div className="sparkline">
      {values.map((value, idx) => (
        <span key={idx} style={{ height: `${value}%` }} />
      ))}
    </div>
  );
}
