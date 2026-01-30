"use client";

import { type InputHTMLAttributes } from "react";

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
};

export function Switch({
  label,
  description,
  size = "md",
  variant = "default",
  id,
  className = "",
  disabled,
  ...props
}: SwitchProps) {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`switch-container ${disabled ? "switch-container--disabled" : ""} ${className}`}>
      <label className="switch-wrapper" htmlFor={switchId}>
        <input type="checkbox" id={switchId} className="switch-input" disabled={disabled} {...props} />
        <span className={`switch-slider switch-slider--${size} switch-slider--${variant}`} />
      </label>
      {(label || description) && (
        <div className="switch-label-group">
          {label && (
            <label htmlFor={switchId} className="switch-label">
              {label}
            </label>
          )}
          {description && <p className="switch-description">{description}</p>}
        </div>
      )}
    </div>
  );
}
