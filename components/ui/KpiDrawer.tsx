"use client";

import { useState, type ReactNode } from "react";

export function KpiDrawer({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="kpi-drawer">
      <button className="secondary-btn" type="button" onClick={() => setOpen(true)}>
        Open {title}
      </button>
      {open ? (
        <div className="kpi-drawer__panel">
          <div className="kpi-drawer__header">
            <strong>{title}</strong>
            <button className="secondary-btn" type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="kpi-drawer__body">{children}</div>
        </div>
      ) : null}
    </div>
  );
}
