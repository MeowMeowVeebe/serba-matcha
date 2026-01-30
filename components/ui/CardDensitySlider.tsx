"use client";

import { useState } from "react";

export function CardDensitySlider() {
  const [value, setValue] = useState(2);
  return (
    <div className="card-density">
      <label className="card-density__label">Card Density</label>
      <input
        type="range"
        min={1}
        max={3}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
    </div>
  );
}
