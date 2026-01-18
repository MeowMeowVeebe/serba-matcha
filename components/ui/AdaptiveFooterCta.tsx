"use client";

import type { ReactNode } from "react";

export function AdaptiveFooterCta({ title, description, action }: { title: string; description: string; action: ReactNode }) {
  return (
    <div className="footer-cta">
      <div>
        <div className="footer-cta__title">{title}</div>
        <div className="footer-cta__desc">{description}</div>
      </div>
      <div>{action}</div>
    </div>
  );
}
