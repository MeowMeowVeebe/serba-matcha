"use client";

import type { ReactNode } from "react";

export function FloatingQuickFix({ children }: { children: ReactNode }) {
  return <div className="floating-quick-fix">{children}</div>;
}
