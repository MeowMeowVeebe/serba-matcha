"use client";

export function AdoptionMeter({ value }: { value: number }) {
  const percent = Math.min(100, Math.max(0, value));
  return (
    <div className="adoption-meter">
      <div className="adoption-meter__label">Feature adoption {percent}%</div>
      <div className="adoption-meter__bar">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
