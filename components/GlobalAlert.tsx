"use client";

import { useEffect, useMemo, useState } from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

type GlobalAlertProps = {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
  onClose: () => void;
};

export default function GlobalAlert({ message, variant = "info", durationMs = 3000, onClose }: GlobalAlertProps) {
  const [hide, setHide] = useState(false);

  const className = useMemo(() => {
    const v = variant ?? "info";
    return `global-alert global-alert--${v} ${hide ? "hide" : ""}`;
  }, [variant, hide]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    // Reset animation state when message/variant changes.
    setHide(false);
  }, [message, variant]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHide(true);
      window.setTimeout(onClose, 300);
    }, Math.max(0, durationMs));

    return () => window.clearTimeout(timer);
  }, [durationMs, onClose]);

  return (
    <div className={className} role={variant === "error" ? "alert" : "status"} aria-live={variant === "error" ? "assertive" : "polite"}>
      <span>{message}</span>
      <button onClick={onClose} aria-label="Tutup">×</button>
    </div>
  );
}
