"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "danger";
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  confirmVariant = "default",
  isConfirming,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 300,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(560px, 96vw)", border: "1px solid rgba(0,0,0,0.12)" }}
      >
        <div className="card-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          {description ? <p style={{ margin: "6px 0 0", opacity: 0.8 }}>{description}</p> : null}
        </div>

        <div style={{ padding: 12, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="secondary-btn" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </button>
          <button
            className="primary-btn"
            onClick={() => void onConfirm()}
            disabled={isConfirming}
            style={confirmVariant === "danger" ? { background: "#b00020" } : undefined}
          >
            {isConfirming ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
