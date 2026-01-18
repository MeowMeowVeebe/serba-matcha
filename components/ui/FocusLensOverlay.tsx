"use client";

import { useState } from "react";

export function FocusLensOverlay() {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="focus-lens">
      <button className="secondary-btn" type="button" onClick={() => setEnabled((v) => !v)}>
        {enabled ? "Disable Focus Lens" : "Enable Focus Lens"}
      </button>
      {enabled ? <div className="focus-lens__overlay" aria-hidden /> : null}
    </div>
  );
}
