"use client";

import { useEffect, useState } from "react";

type GlobalAlertProps = {
  message: string;
  show: boolean;
  onClose: () => void;
};

export default function GlobalAlert({
  message,
  show,
  onClose,
}: GlobalAlertProps) {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      setHide(true);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`global-alert ${hide ? "hide" : ""}`}>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
}
