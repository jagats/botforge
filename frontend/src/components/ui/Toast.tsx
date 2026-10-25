"use client";

import React, { useEffect } from "react";
import {
  PiCheckCircleLight,
  PiXCircleLight,
  PiWarningLight,
  PiInfoLight,
  PiXLight,
} from "react-icons/pi";

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
      border: "border-emerald-200",
      iconBg: "bg-emerald-100 text-emerald-700",
      icon: <PiCheckCircleLight size={18} />,
    },
    error: {
      border: "border-rose-200",
      iconBg: "bg-rose-100 text-rose-700",
      icon: <PiXCircleLight size={18} />,
    },
    warning: {
      border: "border-amber-200",
      iconBg: "bg-amber-100 text-amber-700",
      icon: <PiWarningLight size={18} />,
    },
    info: {
      border: "border-sky-200",
      iconBg: "bg-sky-100 text-sky-700",
      icon: <PiInfoLight size={18} />,
    },
  }[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 w-full max-w-sm rounded-2xl border p-4 shadow-xl bg-[#ffffff] transition-all duration-300 animate-slide-up clay-card-elevated ${typeConfig.border}`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${typeConfig.iconBg}`}>
        {typeConfig.icon}
      </div>

      <div className="flex-1 pt-0.5">
        {title && <p className="text-xs font-bold text-[#1b4332]">{title}</p>}
        <p className="text-xs text-[#3f5e50] leading-relaxed">{message}</p>
      </div>

      <button
        onClick={() => onClose(id)}
        aria-label="Dismiss toast"
        className="rounded-lg p-1 text-[#52796f] hover:text-[#1b4332] hover:bg-[#f1faee] transition-colors cursor-pointer"
      >
        <PiXLight size={16} />
      </button>
    </div>
  );
};
