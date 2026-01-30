"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    loadingText = "Loading...",
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    children,
    className = "",
    ...props
  },
  ref
) {
  const baseClass = "btn";
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const fullWidthClass = fullWidth ? "btn--full" : "";
  const loadingClass = isLoading ? "btn--loading" : "";

  const combinedClassName = [baseClass, variantClass, sizeClass, fullWidthClass, loadingClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button ref={ref} className={combinedClassName} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <>
          <span className="btn__spinner" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>}
          <span className="btn__content">{children}</span>
          {rightIcon && <span className="btn__icon btn__icon--right">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});
