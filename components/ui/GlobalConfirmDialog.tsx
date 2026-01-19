"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

// ============================================
// Types
// ============================================

type DialogVariant = "danger" | "warning" | "info" | "success";

type DialogIcon = {
  danger: string;
  warning: string;
  info: string;
  success: string;
};

type ConfirmDialogOptions = {
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: ReactNode;
  /** Hide cancel button for alert-only dialogs */
  hideCancel?: boolean;
  /** Auto close after confirm (default true) */
  autoClose?: boolean;
};

type ConfirmDialogState = ConfirmDialogOptions & {
  isOpen: boolean;
  isLoading: boolean;
  resolve: ((value: boolean) => void) | null;
};

type GlobalConfirmContextType = {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  alert: (options: Omit<ConfirmDialogOptions, "cancelText" | "hideCancel">) => Promise<void>;
};

// ============================================
// Context
// ============================================

const GlobalConfirmContext = createContext<GlobalConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(GlobalConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within GlobalConfirmProvider");
  }
  return context;
}

// ============================================
// Icons - Modern SVG Icons
// ============================================

const IconSvgs = {
  danger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

const icons: DialogIcon = {
  danger: "danger",
  warning: "warning",
  info: "info",
  success: "success",
};

// ============================================
// Styles - Modern Glassmorphism Design
// ============================================

const styles = `
  .confirm-dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .confirm-dialog-backdrop.open {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    opacity: 1;
  }

  .confirm-dialog {
    --dialog-bg: #ffffff;
    --dialog-border: rgba(0, 0, 0, 0.08);
    --dialog-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
    --dialog-title: #111827;
    --dialog-text: #6b7280;
    --dialog-btn-secondary-bg: #f3f4f6;
    --dialog-btn-secondary-text: #374151;
    --dialog-btn-secondary-border: #e5e7eb;
    --dialog-btn-secondary-hover: #e5e7eb;

    background: var(--dialog-bg);
    border-radius: 20px;
    box-shadow: var(--dialog-shadow);
    width: min(400px, calc(100vw - 40px));
    max-height: calc(100vh - 40px);
    overflow: hidden;
    transform: scale(0.92) translateY(24px);
    opacity: 0;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .confirm-dialog-backdrop.open .confirm-dialog {
    transform: scale(1) translateY(0);
    opacity: 1;
  }

  .confirm-dialog-backdrop.closing {
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
    opacity: 0;
    transition: all 0.2s ease-out;
  }

  .confirm-dialog-backdrop.closing .confirm-dialog {
    transform: scale(0.95) translateY(16px);
    opacity: 0;
    transition: all 0.2s ease-out;
  }

  .confirm-dialog__header {
    padding: 28px 28px 0;
    text-align: center;
  }

  .confirm-dialog__icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    transition: transform 0.3s ease;
  }

  .confirm-dialog__icon svg {
    width: 28px;
    height: 28px;
  }

  .confirm-dialog-backdrop.open .confirm-dialog__icon {
    animation: icon-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
  }

  @keyframes icon-pop {
    0% { transform: scale(0.5); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .confirm-dialog__icon--danger {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    color: #dc2626;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
  }

  .confirm-dialog__icon--warning {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    color: #d97706;
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.15);
  }

  .confirm-dialog__icon--info {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    color: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
  }

  .confirm-dialog__icon--success {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    color: #059669;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15);
  }

  .confirm-dialog__title {
    margin: 0 0 8px;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--dialog-title);
    line-height: 1.4;
    letter-spacing: -0.01em;
  }

  .confirm-dialog__body {
    padding: 8px 28px 28px;
    text-align: center;
  }

  .confirm-dialog__message {
    margin: 0;
    font-size: 0.925rem;
    color: var(--dialog-text);
    line-height: 1.65;
  }

  .confirm-dialog__message p {
    margin: 0;
  }

  .confirm-dialog__message p + p {
    margin-top: 8px;
  }

  .confirm-dialog__footer {
    padding: 0 28px 28px;
    display: flex;
    gap: 12px;
  }

  .confirm-dialog__footer--single {
    justify-content: center;
  }

  .confirm-dialog__footer--single .confirm-dialog__btn {
    flex: none;
    min-width: 140px;
  }

  .confirm-dialog__btn {
    flex: 1;
    padding: 13px 22px;
    border-radius: 12px;
    font-size: 0.925rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    position: relative;
    overflow: hidden;
  }

  .confirm-dialog__btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .confirm-dialog__btn:hover::before {
    opacity: 1;
  }

  .confirm-dialog__btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .confirm-dialog__btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .confirm-dialog__btn--cancel {
    background: var(--dialog-btn-secondary-bg);
    color: var(--dialog-btn-secondary-text);
    border: 1px solid var(--dialog-btn-secondary-border);
  }

  .confirm-dialog__btn--cancel:hover:not(:disabled) {
    background: var(--dialog-btn-secondary-hover);
  }

  .confirm-dialog__btn--confirm {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  }

  .confirm-dialog__btn--confirm:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
    transform: translateY(-1px);
  }

  .confirm-dialog__btn--danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
  }

  .confirm-dialog__btn--danger:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.45);
    transform: translateY(-1px);
  }

  .confirm-dialog__btn--warning {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35);
  }

  .confirm-dialog__btn--warning:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(217, 119, 6, 0.45);
    transform: translateY(-1px);
  }

  .confirm-dialog__btn--info {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  }

  .confirm-dialog__btn--info:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
    transform: translateY(-1px);
  }

  .confirm-dialog__btn--success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);
  }

  .confirm-dialog__btn--success:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(5, 150, 105, 0.45);
    transform: translateY(-1px);
  }

  /* Loading spinner */
  .confirm-dialog__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: dialog-spin 0.7s linear infinite;
  }

  @keyframes dialog-spin {
    to { transform: rotate(360deg); }
  }

  /* Dark mode - class based */
  .dark .confirm-dialog,
  [data-theme="dark"] .confirm-dialog {
    --dialog-bg: #1f2937;
    --dialog-border: rgba(255, 255, 255, 0.08);
    --dialog-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    --dialog-title: #f9fafb;
    --dialog-text: #9ca3af;
    --dialog-btn-secondary-bg: #374151;
    --dialog-btn-secondary-text: #e5e7eb;
    --dialog-btn-secondary-border: #4b5563;
    --dialog-btn-secondary-hover: #4b5563;
  }

  .dark .confirm-dialog__icon--danger,
  [data-theme="dark"] .confirm-dialog__icon--danger {
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(220, 38, 38, 0.25) 100%);
  }

  .dark .confirm-dialog__icon--warning,
  [data-theme="dark"] .confirm-dialog__icon--warning {
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%);
  }

  .dark .confirm-dialog__icon--info,
  [data-theme="dark"] .confirm-dialog__icon--info {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%);
  }

  .dark .confirm-dialog__icon--success,
  [data-theme="dark"] .confirm-dialog__icon--success {
    background: linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%);
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .confirm-dialog,
    .confirm-dialog-backdrop {
      transition: opacity 0.15s ease;
    }

    .confirm-dialog-backdrop.open .confirm-dialog {
      transform: scale(1) translateY(0);
    }

    .confirm-dialog-backdrop.open .confirm-dialog__icon {
      animation: none;
    }

    .confirm-dialog__btn:hover:not(:disabled) {
      transform: none;
    }
  }

  /* Mobile responsive */
  @media (max-width: 480px) {
    .confirm-dialog {
      width: calc(100vw - 32px);
      border-radius: 16px;
    }

    .confirm-dialog__header {
      padding: 24px 20px 0;
    }

    .confirm-dialog__body {
      padding: 8px 20px 24px;
    }

    .confirm-dialog__footer {
      padding: 0 20px 24px;
      flex-direction: column-reverse;
    }

    .confirm-dialog__footer--single {
      flex-direction: column;
    }

    .confirm-dialog__btn {
      width: 100%;
    }
  }
`;

// ============================================
// Dialog Component
// ============================================

function ConfirmDialog({
  state,
  onConfirm,
  onCancel,
}: {
  state: ConfirmDialogState;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const variant = state.variant || "info";

  // Focus management
  useEffect(() => {
    if (state.isOpen && !isClosing) {
      // Focus the cancel button (safer default) or confirm if no cancel
      setTimeout(() => {
        if (state.hideCancel) {
          confirmBtnRef.current?.focus();
        } else {
          dialogRef.current?.querySelector<HTMLButtonElement>(".confirm-dialog__btn--cancel")?.focus();
        }
      }, 100);
    }
  }, [state.isOpen, state.hideCancel, isClosing]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.isOpen && !state.isLoading) {
        handleClose();
      }
    };

    if (state.isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [state.isOpen, state.isLoading]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
      setIsClosing(false);
    }, 150);
  }, [onCancel]);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !state.isLoading) {
        handleClose();
      }
    },
    [state.isLoading, handleClose]
  );

  if (!state.isOpen && !isClosing) return null;

  const displayIcon = state.icon || IconSvgs[variant];

  return (
    <>
      <style>{styles}</style>
      <div
        className={`confirm-dialog-backdrop ${state.isOpen && !isClosing ? "open" : ""} ${isClosing ? "closing" : ""}`}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div ref={dialogRef} className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-dialog__header">
            <div className={`confirm-dialog__icon confirm-dialog__icon--${variant}`}>
              {displayIcon}
            </div>
            <h2 id="confirm-dialog-title" className="confirm-dialog__title">
              {state.title}
            </h2>
          </div>

          <div className="confirm-dialog__body">
            <div id="confirm-dialog-message" className="confirm-dialog__message">
              {state.message}
            </div>
          </div>

          <div className={`confirm-dialog__footer ${state.hideCancel ? "confirm-dialog__footer--single" : ""}`}>
            {!state.hideCancel && (
              <button
                type="button"
                className="confirm-dialog__btn confirm-dialog__btn--cancel"
                onClick={handleClose}
                disabled={state.isLoading}
              >
                {state.cancelText || "Batal"}
              </button>
            )}
            <button
              ref={confirmBtnRef}
              type="button"
              className={`confirm-dialog__btn confirm-dialog__btn--confirm confirm-dialog__btn--${variant}`}
              onClick={handleConfirm}
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <>
                  <span className="confirm-dialog__spinner" />
                  Memproses...
                </>
              ) : (
                state.confirmText || "Ya, Lanjutkan"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// Provider
// ============================================

export function GlobalConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    isLoading: false,
    title: "",
    message: "",
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        ...options,
        isOpen: true,
        isLoading: false,
        resolve,
      });
    });
  }, []);

  const alert = useCallback(
    async (options: Omit<ConfirmDialogOptions, "cancelText" | "hideCancel">): Promise<void> => {
      await confirm({
        ...options,
        hideCancel: true,
        confirmText: options.confirmText || "OK",
      });
    },
    [confirm]
  );

  const handleConfirm = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    // Small delay to show loading state
    setTimeout(() => {
      state.resolve?.(true);
      setState((prev) => ({
        ...prev,
        isOpen: false,
        isLoading: false,
        resolve: null,
      }));
    }, 300);
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({
      ...prev,
      isOpen: false,
      isLoading: false,
      resolve: null,
    }));
  }, [state.resolve]);

  return (
    <GlobalConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      <ConfirmDialog state={state} onConfirm={handleConfirm} onCancel={handleCancel} />
    </GlobalConfirmContext.Provider>
  );
}

// ============================================
// Export default for easy import
// ============================================

export default GlobalConfirmProvider;
