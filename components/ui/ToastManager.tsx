"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

type ToastContextType = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(7);
      const newToast = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration || 5000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case "success": return "✓";
      case "error": return "✕";
      case "warning": return "⚠";
      case "info": return "ℹ";
    }
  };

  const getToastColor = (type: ToastType) => {
    switch (type) {
      case "success": return { bg: "#10B981", border: "#059669" };
      case "error": return { bg: "#EF4444", border: "#DC2626" };
      case "warning": return { bg: "#F59E0B", border: "#D97706" };
      case "info": return { bg: "#3B82F6", border: "#2563EB" };
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        maxWidth: "400px",
        width: "calc(100vw - 2rem)",
      }}
    >
      {toasts.map((toast, index) => {
        const colors = getToastColor(toast.type);
        return (
          <div
            key={toast.id}
            style={{
              background: "white",
              borderLeft: `4px solid ${colors.border}`,
              borderRadius: "0.5rem",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
              padding: "1rem",
              display: "flex",
              gap: "0.75rem",
              alignItems: "start",
              animation: "slideIn 0.3s ease-out",
              transform: `translateY(${index * 10}px)`,
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: colors.bg,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "1.25rem",
                flexShrink: 0,
              }}
            >
              {getToastIcon(toast.type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                {toast.title}
              </div>
              {toast.message && (
                <div style={{ fontSize: "0.875rem", color: "var(--color-gray-600)" }}>
                  {toast.message}
                </div>
              )}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
                opacity: 0.5,
                fontSize: "1.25rem",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
