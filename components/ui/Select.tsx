"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  inputSize?: "sm" | "md" | "lg";
  containerClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    error,
    helperText,
    options,
    placeholder,
    inputSize = "md",
    containerClassName,
    id,
    className,
    disabled,
    ...props
  },
  ref
) {
  const selectId = id ?? props.name ?? `select-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);

  const selectClass = [
    "input",
    `input--${inputSize}`,
    hasError ? "input--error" : "",
    disabled ? "input--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName ?? "input-group"}>
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={selectClass}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && !error && (
        <p id={`${selectId}-helper`} className="input-helper">
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${selectId}-error`} className="input-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
