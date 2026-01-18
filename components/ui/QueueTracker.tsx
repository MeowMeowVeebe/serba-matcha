"use client";

export function QueueTracker({ label, value }: { label: string; value: number }) {
  return (
    <div className="queue-tracker">
      <div className="queue-tracker__label">{label}</div>
      <div className="queue-tracker__bar">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
