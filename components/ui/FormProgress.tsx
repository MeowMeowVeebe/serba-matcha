"use client";

export function FormProgress({ current, total }: { current: number; total: number }) {
  const percent = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="form-progress" aria-label="Form progress">
      <div className="form-progress__label">Progress {current}/{total}</div>
      <div className="form-progress__bar">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
