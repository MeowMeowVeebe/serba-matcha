"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputSize?: "sm" | "md" | "lg";
  containerClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    inputSize = "md",
    containerClassName,
    id,
    className,
    disabled,
    ...props
  },
  ref
) {
  const inputId = id ?? props.name ?? `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);

  const inputClass = [
    "input",
    `input--${inputSize}`,
    hasError ? "input--error" : "",
    leftIcon ? "input--with-left-icon" : "",
    rightIcon ? "input--with-right-icon" : "",
    disabled ? "input--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName ?? "input-group"}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {leftIcon && <span className="input-icon input-icon--left">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={inputClass}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {rightIcon && <span className="input-icon input-icon--right">{rightIcon}</span>}
      </div>
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="input-helper">
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="input-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
