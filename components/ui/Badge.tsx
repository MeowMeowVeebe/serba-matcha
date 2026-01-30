"use client";

import type { ReactNode } from "react";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";
export type BadgeSize = "sm" | "md" | "lg";

export type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  rounded?: boolean;
  className?: string;
  children: ReactNode;
};

export function Badge({ variant = "default", size = "md", dot = false, rounded = true, className = "", children }: BadgeProps) {
  const baseClass = "ds-badge";
  const variantClass = `ds-badge--${variant}`;
  const sizeClass = `ds-badge--${size}`;
  const dotClass = dot ? "ds-badge--with-dot" : "";
  const roundedClass = rounded ? "ds-badge--rounded" : "";

  const combinedClassName = [baseClass, variantClass, sizeClass, dotClass, roundedClass, className].filter(Boolean).join(" ");

  return (
    <span className={combinedClassName}>
      {dot && <span className="ds-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
