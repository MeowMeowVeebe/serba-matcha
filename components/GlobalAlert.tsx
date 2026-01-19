"use client";

import { useEffect, useState, useCallback } from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

type GlobalAlertProps = {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
  onClose: () => void;
};

// Modern SVG Icons
const Icons = {
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

// Inline styles for the toast
const styles = `
  .toast-notification {
    --toast-bg: #ffffff;
    --toast-border: #e5e7eb;
    --toast-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
    --toast-text: #1f2937;
    --toast-text-secondary: #6b7280;
    
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    background: var(--toast-bg);
    border-radius: 14px;
    box-shadow: var(--toast-shadow);
    min-width: 320px;
    max-width: 420px;
    transform: translateX(120%);
    opacity: 0;
    animation: toast-slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    position: relative;
    overflow: hidden;
  }

  .toast-notification::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 14px 0 0 14px;
  }

  .toast-notification.hide {
    animation: toast-slide-out 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes toast-slide-in {
    from {
      transform: translateX(120%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes toast-slide-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(120%);
      opacity: 0;
    }
  }

  /* Icon container */
  .toast-notification__icon {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  .toast-notification__icon svg {
    width: 100%;
    height: 100%;
  }

  /* Content */
  .toast-notification__content {
    flex: 1;
    min-width: 0;
  }

  .toast-notification__message {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--toast-text);
    line-height: 1.5;
    word-break: break-word;
  }

  /* Close button */
  .toast-notification__close {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--toast-text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    margin: -4px -4px -4px 0;
  }

  .toast-notification__close:hover {
    background: rgba(0, 0, 0, 0.06);
    color: var(--toast-text);
  }

  .toast-notification__close:active {
    transform: scale(0.92);
  }

  .toast-notification__close svg {
    width: 16px;
    height: 16px;
  }

  /* Progress bar */
  .toast-notification__progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }

  .toast-notification__progress-bar {
    height: 100%;
    width: 100%;
    transform-origin: left;
    animation: toast-progress linear forwards;
  }

  @keyframes toast-progress {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }

  /* Variant: Info */
  .toast-notification--info::before {
    background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  }
  .toast-notification--info .toast-notification__icon {
    color: #3b82f6;
  }
  .toast-notification--info .toast-notification__progress-bar {
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
  }

  /* Variant: Success */
  .toast-notification--success::before {
    background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  }
  .toast-notification--success .toast-notification__icon {
    color: #10b981;
  }
  .toast-notification--success .toast-notification__progress-bar {
    background: linear-gradient(90deg, #10b981, #34d399);
  }

  /* Variant: Warning */
  .toast-notification--warning::before {
    background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
  }
  .toast-notification--warning .toast-notification__icon {
    color: #f59e0b;
  }
  .toast-notification--warning .toast-notification__progress-bar {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
  }

  /* Variant: Error */
  .toast-notification--error::before {
    background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
  }
  .toast-notification--error .toast-notification__icon {
    color: #ef4444;
  }
  .toast-notification--error .toast-notification__progress-bar {
    background: linear-gradient(90deg, #ef4444, #f87171);
  }

  /* Dark mode */
  .dark .toast-notification,
  [data-theme="dark"] .toast-notification {
    --toast-bg: #1f2937;
    --toast-border: #374151;
    --toast-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    --toast-text: #f9fafb;
    --toast-text-secondary: #9ca3af;
  }

  .dark .toast-notification__close:hover,
  [data-theme="dark"] .toast-notification__close:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .dark .toast-notification__progress,
  [data-theme="dark"] .toast-notification__progress {
    background: rgba(255, 255, 255, 0.08);
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .toast-notification {
      animation: toast-fade-in 0.2s ease forwards;
    }
    .toast-notification.hide {
      animation: toast-fade-out 0.2s ease forwards;
    }
    @keyframes toast-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes toast-fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  }
`;

export default function GlobalAlert({ message, variant = "info", durationMs = 3000, onClose }: GlobalAlertProps) {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    setHide(false);
  }, [message, variant]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHide(true);
      window.setTimeout(onClose, 300);
    }, Math.max(0, durationMs));

    return () => window.clearTimeout(timer);
  }, [durationMs, onClose]);

  const handleClose = useCallback(() => {
    setHide(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  return (
    <>
      <style>{styles}</style>
      <div 
        className={`toast-notification toast-notification--${variant} ${hide ? "hide" : ""}`}
        role={variant === "error" ? "alert" : "status"} 
        aria-live={variant === "error" ? "assertive" : "polite"}
      >
        <span className="toast-notification__icon">
          {Icons[variant]}
        </span>
        
        <div className="toast-notification__content">
          <p className="toast-notification__message">{message}</p>
        </div>

        <button 
          className="toast-notification__close"
          onClick={handleClose} 
          aria-label="Tutup notifikasi"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="toast-notification__progress">
          <div 
            className="toast-notification__progress-bar" 
            style={{ animationDuration: `${durationMs}ms` }}
          />
        </div>
      </div>
    </>
  );
}
