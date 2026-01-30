"use client";

import { useState } from "react";

export function SectionFeedback({ prompt = "Was this helpful?" }: { prompt?: string }) {
  const [selected, setSelected] = useState<"yes" | "no" | null>(null);

  return (
    <div className="section-feedback">
      <span className="section-feedback__prompt">{prompt}</span>
      <div className="section-feedback__actions">
        {(["yes", "no"] as const).map((value) => (
          <button
            key={value}
            className={`section-feedback__btn ${selected === value ? "active" : ""}`}
            type="button"
            onClick={() => setSelected(value)}
          >
            {value === "yes" ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}
