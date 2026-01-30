"use client";

import type { ReactNode } from "react";

export function InlineHint({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="inline-hint">
      <div>
        <div className="inline-hint__title">{title}</div>
        {description ? <div className="inline-hint__desc">{description}</div> : null}
      </div>
      {action ? <div className="inline-hint__action">{action}</div> : null}
    </div>
  );
}
