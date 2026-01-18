"use client";

import { useState } from "react";

const modes = ["Morning", "Afternoon", "Evening"] as const;

export function TemporalToggle() {
  const [active, setActive] = useState<(typeof modes)[number]>(modes[0]);
  return (
    <div className="temporal-toggle">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          className={`temporal-toggle__btn ${active === mode ? "active" : ""}`}
          onClick={() => setActive(mode)}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
