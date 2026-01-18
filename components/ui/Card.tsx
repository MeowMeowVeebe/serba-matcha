"use client";

import type { ReactNode } from "react";

export type CardVariant = "default" | "bordered" | "elevated" | "flat";

export type CardProps = {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  className?: string;
  children: ReactNode;
};

export function Card({ variant = "default", padding = "md", hoverable = false, className = "", children }: CardProps) {
  const baseClass = "ds-card";
  const variantClass = `ds-card--${variant}`;
  const paddingClass = `ds-card--padding-${padding}`;
  const hoverClass = hoverable ? "ds-card--hoverable" : "";

  const combinedClassName = [baseClass, variantClass, paddingClass, hoverClass, className].filter(Boolean).join(" ");

  return <div className={combinedClassName}>{children}</div>;
}

export type CardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function CardHeader({ title, description, action, className = "" }: CardHeaderProps) {
  return (
    <div className={`ds-card-header ${className}`}>
      <div className="ds-card-header__content">
        <h3 className="ds-card-header__title">{title}</h3>
        {description && <p className="ds-card-header__description">{description}</p>}
      </div>
      {action && <div className="ds-card-header__action">{action}</div>}
    </div>
  );
}

export type CardBodyProps = {
  className?: string;
  children: ReactNode;
};

export function CardBody({ className = "", children }: CardBodyProps) {
  return <div className={`ds-card-body ${className}`}>{children}</div>;
}

export type CardFooterProps = {
  className?: string;
  align?: "left" | "center" | "right" | "between";
  children: ReactNode;
};

export function CardFooter({ className = "", align = "right", children }: CardFooterProps) {
  return <div className={`ds-card-footer ds-card-footer--${align} ${className}`}>{children}</div>;
}
