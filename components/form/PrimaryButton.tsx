"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingLabel?: ReactNode;
};

export default function PrimaryButton({
  isLoading,
  loadingLabel = (
    <span className="auth-btn-row">
      <span className="auth-spinner" aria-hidden />
      Memproses...
    </span>
  ),
  disabled,
  children,
  className = "auth-primary-btn",
  ...props
}: Props) {
  return (
    <button className={className} disabled={disabled || isLoading} {...props}>
      {isLoading ? loadingLabel : children}
    </button>
  );
}
