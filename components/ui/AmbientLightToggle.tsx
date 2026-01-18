"use client";

import { useState } from "react";

export function AmbientLightToggle() {
  const [enabled, setEnabled] = useState(false);

  return (
    <button
      className="secondary-btn"
      type="button"
      onClick={() => {
        setEnabled((prev) => !prev);
        document.body.classList.toggle("ambient-light", !enabled);
      }}
    >
      {enabled ? "Disable Ambient Light" : "Enable Ambient Light"}
    </button>
  );
}
