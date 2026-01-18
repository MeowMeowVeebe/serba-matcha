"use client";

export function LiveTicker({ text }: { text: string }) {
  return (
    <div className="live-ticker" aria-live="polite">
      <span className="live-ticker__dot" aria-hidden />
      <span>{text}</span>
    </div>
  );
}
