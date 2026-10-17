"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, ToastProps } from "../components/ui/Toast";

interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
  };
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (
      type: "success" | "error" | "info" | "warning",
      message: string,
      title?: string,
      duration = 4000
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message, title, duration }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string, title?: string, duration?: number) =>
      addToast("success", msg, title, duration),
    error: (msg: string, title?: string, duration?: number) =>
      addToast("error", msg, title, duration),
    info: (msg: string, title?: string, duration?: number) =>
      addToast("info", msg, title, duration),
    warning: (msg: string, title?: string, duration?: number) =>
      addToast("warning", msg, title, duration),
  };

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-auto">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            type={t.type}
            title={t.title}
            message={t.message}
            duration={t.duration}
            onClose={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
