"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import GlobalAlert, { type ToastVariant } from "../components/GlobalAlert";

type ShowAlertOptions = {
  variant?: ToastVariant;
  durationMs?: number;
};

type AlertContextType = {
  showAlert: (message: string, options?: ShowAlertOptions) => void;
};

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
};

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// Modern toast stack styles
const stackStyles = `
  .toast-stack {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
    max-height: calc(100vh - 40px);
    overflow: hidden;
  }

  .toast-stack > * {
    pointer-events: auto;
  }

  /* Mobile responsive */
  @media (max-width: 480px) {
    .toast-stack {
      top: auto;
      bottom: 20px;
      right: 12px;
      left: 12px;
    }

    .toast-stack .toast-notification {
      min-width: 0;
      max-width: none;
      width: 100%;
    }
  }
`;

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showAlert = useCallback((message: string, options?: ShowAlertOptions) => {
    const variant = options?.variant ?? "info";
    const durationMs = options?.durationMs ?? 3000;

    const toast: ToastItem = { id: uid(), message, variant, durationMs };

    setToasts((prev) => {
      const next = [toast, ...prev];
      // avoid huge stacks - max 5 toasts
      return next.slice(0, 5);
    });
  }, []);

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <style>{stackStyles}</style>
      <div className="toast-stack" aria-label="Notifications" role="region">
        {toasts.map((t) => (
          <GlobalAlert
            key={t.id}
            message={t.message}
            variant={t.variant}
            durationMs={t.durationMs}
            onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
};
