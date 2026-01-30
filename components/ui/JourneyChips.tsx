"use client";

export function JourneyChips({ steps }: { steps: string[] }) {
  return (
    <div className="journey-chips">
      {steps.map((step) => (
        <span key={step} className="journey-chips__item">
          {step}
        </span>
      ))}
    </div>
  );
}
