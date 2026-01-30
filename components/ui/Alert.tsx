"use client";

import { type ReactNode } from "react";

export type AlertVariant = "default" | "success" | "warning" | "danger" | "info";

export type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  closable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function Alert({
  variant = "default",
  title,
  children,
  icon,
  onClose,
  closable = false,
  action,
}: AlertProps) {
  const defaultIcons = {
    default: "ℹ️",
    success: "✓",
    warning: "⚠️",
    danger: "✕",
    info: "ℹ️",
  };

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div className={`alert alert--${variant}`} role="alert">
      {displayIcon && <div className="alert-icon">{displayIcon}</div>}
      
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-message">{children}</div>
      </div>

      {action && (
        <button className="alert-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}

      {closable && onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Close alert">
          ✕
        </button>
      )}
    </div>
  );
}
