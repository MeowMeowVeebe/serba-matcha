"use client";

import { useState } from "react";

const presets = ["night", "forest", "obsidian"] as const;

export function ThemePresets() {
  const [active, setActive] = useState<(typeof presets)[number]>("night");

  const handlePreset = (preset: (typeof presets)[number]) => {
    setActive(preset);
    document.body.setAttribute("data-theme-preset", preset);
  };

  return (
    <div className="theme-presets">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          className={`theme-presets__item ${active === preset ? "active" : ""}`}
          onClick={() => handlePreset(preset)}
        >
          {preset}
        </button>
      ))}
    </div>
  );
}
