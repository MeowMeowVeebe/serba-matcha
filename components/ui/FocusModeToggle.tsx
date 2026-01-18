"use client";

import { useEffect, useState } from "react";

export function FocusModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("focus-mode", enabled);
  }, [enabled]);

  return (
    <button className="secondary-btn" type="button" onClick={() => setEnabled((v) => !v)}>
      {enabled ? "Exit Focus Mode" : "Focus Mode"}
    </button>
  );
}
