"use client";

import type { ReactNode } from "react";

export function QuickFixPanel({ title, action }: { title: string; action: ReactNode }) {
  return (
    <div className="quick-fix">
      <div className="quick-fix__title">{title}</div>
      {action}
    </div>
  );
}
