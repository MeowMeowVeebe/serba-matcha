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

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showAlert = useCallback((message: string, options?: ShowAlertOptions) => {
    const variant = options?.variant ?? "info";
    const durationMs = options?.durationMs ?? 3000;

    const toast: ToastItem = { id: uid(), message, variant, durationMs };

    setToasts((prev) => {
      const next = [toast, ...prev];
      // avoid huge stacks
      return next.slice(0, 5);
    });
  }, []);

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <div className="global-alert-stack" aria-label="Notifications">
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
