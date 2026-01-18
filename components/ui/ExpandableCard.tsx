"use client";

import { useState, type ReactNode } from "react";

export function ExpandableCard({
  title,
  subtitle,
  defaultExpanded = true,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="expandable-card">
      <button type="button" className="expandable-card__header" onClick={() => setExpanded((prev) => !prev)}>
        <div>
          <div className="expandable-card__title">{title}</div>
          {subtitle ? <div className="expandable-card__subtitle">{subtitle}</div> : null}
        </div>
        <span className="expandable-card__toggle">{expanded ? "Hide" : "Show"}</span>
      </button>
      {expanded ? <div className="expandable-card__body">{children}</div> : null}
    </div>
  );
}
