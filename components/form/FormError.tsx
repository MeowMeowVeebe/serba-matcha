"use client";

import type { ReactNode } from "react";

type Props = {
  message?: string;
  action?: ReactNode;
};

export default function FormError({ message, action }: Props) {
  if (!message) return null;
  return (
    <div
      className="auth-form-error"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <span>{message}</span>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
