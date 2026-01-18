"use client";

export function DataMoodBanner({ mood, text }: { mood: "growth" | "stable" | "risk"; text: string }) {
  return (
    <div className={`data-mood data-mood--${mood}`} role="status" aria-live="polite">
      <span className="data-mood__label">{mood.toUpperCase()}</span>
      <span className="data-mood__text">{text}</span>
    </div>
  );
}
