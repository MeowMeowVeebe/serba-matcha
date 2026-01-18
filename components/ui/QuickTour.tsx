"use client";

import { useState } from "react";

const steps = ["Intro", "Metrics", "Actions", "Insights"];

export function QuickTour() {
  const [index, setIndex] = useState(0);

  return (
    <div className="quick-tour">
      <div className="quick-tour__step">Step {index + 1}/{steps.length}: {steps[index]}</div>
      <div className="quick-tour__controls">
        <button className="secondary-btn" type="button" onClick={() => setIndex((prev) => Math.max(0, prev - 1))}>
          Back
        </button>
        <button className="secondary-btn" type="button" onClick={() => setIndex((prev) => Math.min(steps.length - 1, prev + 1))}>
          Next
        </button>
      </div>
    </div>
  );
}
