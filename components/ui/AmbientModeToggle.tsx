"use client";

import { useEffect, useState } from "react";

export function AmbientModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("ambient-mode", enabled);
  }, [enabled]);

  return (
    <button className="secondary-btn" type="button" onClick={() => setEnabled((v) => !v)}>
      {enabled ? "Disable Live Pulse" : "Enable Live Pulse"}
    </button>
  );
}
