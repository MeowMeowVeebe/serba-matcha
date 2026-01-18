"use client";

import { useState } from "react";

const presets = ["admin", "ops", "user"] as const;

export function LayoutPresets() {
  const [active, setActive] = useState<(typeof presets)[number]>(presets[0]);
  return (
    <div className="layout-presets">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          className={`layout-presets__item ${active === preset ? "active" : ""}`}
          onClick={() => setActive(preset)}
        >
          {preset}
        </button>
      ))}
    </div>
  );
}
