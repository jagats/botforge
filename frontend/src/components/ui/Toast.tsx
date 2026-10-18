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
      border: "border-emerald-500/30",
      iconBg: "bg-emerald-500/20 text-emerald-400",
      icon: <PiCheckCircleLight size={18} />,
    },
    error: {
      border: "border-rose-500/30",
      iconBg: "bg-rose-500/20 text-rose-400",
      icon: <PiXCircleLight size={18} />,
    },
    warning: {
      border: "border-amber-400/30",
      iconBg: "bg-amber-400/20 text-amber-300",
      icon: <PiWarningLight size={18} />,
    },
    info: {
      border: "border-sky-400/30",
      iconBg: "bg-sky-400/20 text-sky-300",
      icon: <PiInfoLight size={18} />,
    },
  }[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 w-full max-w-sm rounded-md border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-up glass-card-elevated ${typeConfig.border}`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${typeConfig.iconBg}`}>
        {typeConfig.icon}
      </div>

      <div className="flex-1 pt-0.5">
        {title && <p className="text-xs font-semibold text-[#F5EDE8]">{title}</p>}
        <p className="text-xs text-[#C4B4A8] leading-relaxed">{message}</p>
      </div>

      <button
        onClick={() => onClose(id)}
        aria-label="Dismiss toast"
        className="rounded-md p-1 text-[#C4B4A8] hover:text-[#F5EDE8] hover:bg-[rgba(221,208,200,0.12)] transition-colors cursor-pointer"
      >
        <PiXLight size={16} />
      </button>
    </div>
  );
};
