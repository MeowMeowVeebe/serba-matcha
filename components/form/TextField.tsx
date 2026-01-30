"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  containerClassName?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, containerClassName, id, className, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className={containerClassName ?? "form-group"}>
      <label htmlFor={inputId}>{label}</label>
      <input
        ref={ref}
        id={inputId}
        className={className}
        aria-invalid={Boolean(error) || props["aria-invalid"] === true}
        {...props}
      />
      {hint ? <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>{hint}</div> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
});
