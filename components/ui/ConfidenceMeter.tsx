"use client";

export function ConfidenceMeter({ value }: { value: number }) {
  const percent = Math.min(100, Math.max(0, value));
  return (
    <div className="confidence-meter">
      <div className="confidence-meter__label">Confidence {percent}%</div>
      <div className="confidence-meter__bar">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
