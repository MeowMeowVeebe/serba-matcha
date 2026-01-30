"use client";

import type { ReactNode } from "react";

export function PersonaCard({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="persona-card">
      <div className="persona-card__title">{title}</div>
      <div className="persona-card__subtitle">{subtitle}</div>
      {action ? <div className="persona-card__action">{action}</div> : null}
    </div>
  );
}
