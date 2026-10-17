"use client";

import React, { useEffect } from "react";

export interface ToastProps {
  id: string;
  type?: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = "info",
  title,
  message,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const typeConfig = {
    success: {
      border: "border-emerald-200/80",
      bg: "bg-white/95",
      iconBg: "bg-emerald-50 text-emerald-600",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    error: {
      border: "border-rose-200/80",
      bg: "bg-white/95",
      iconBg: "bg-rose-50 text-rose-600",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      border: "border-amber-200/80",
      bg: "bg-white/95",
      iconBg: "bg-amber-50 text-amber-600",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    info: {
      border: "border-indigo-200/80",
      bg: "bg-white/95",
      iconBg: "bg-indigo-50 text-indigo-600",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  }[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 w-full max-w-sm rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-up ${typeConfig.bg} ${typeConfig.border}`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${typeConfig.iconBg}`}>
        {typeConfig.icon}
      </div>

      <div className="flex-1 pt-0.5">
        {title && <p className="text-xs font-semibold text-slate-900">{title}</p>}
        <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
      </div>

      <button
        onClick={() => onClose(id)}
        aria-label="Dismiss toast"
        className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};
