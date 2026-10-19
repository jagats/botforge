"use client";

import React from "react";

export interface BadgeProps {
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "purple";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  size = "md",
  dot = false,
  className = "",
  children,
}) => {
  const sizeStyles = {
    sm: "px-3 py-1 text-xs gap-1.5",
    md: "px-4 py-2 text-xs gap-2",
  }[size];

  const variantStyles = {
    success:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-xs",
    warning:
      "bg-amber-400/15 text-amber-300 border-amber-400/30 shadow-xs",
    error:
      "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-xs",
    info:
      "bg-sky-400/15 text-sky-300 border-sky-400/30 shadow-xs",
    neutral:
      "bg-[rgba(221,208,200,0.12)] text-[#C4B4A8] border-[rgba(221,208,200,0.25)] shadow-xs",
    purple:
      "bg-[rgba(221,208,200,0.18)] text-[#DDD0C8] border-[rgba(221,208,200,0.35)] shadow-xs",
  }[variant];

  const dotColors = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    error: "bg-rose-400",
    info: "bg-sky-400",
    neutral: "bg-[#C4B4A8]",
    purple: "bg-[#DDD0C8]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-[4px] border ${sizeStyles} ${variantStyles} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColors} ${
            variant === "warning" || variant === "info" ? "animate-pulse" : ""
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
