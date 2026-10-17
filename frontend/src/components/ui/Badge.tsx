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
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  }[size];

  const variantStyles = {
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs",
    warning:
      "bg-amber-50 text-amber-700 border-amber-200/80 shadow-xs",
    error:
      "bg-rose-50 text-rose-700 border-rose-200/80 shadow-xs",
    info:
      "bg-blue-50 text-blue-700 border-blue-200/80 shadow-xs",
    neutral:
      "bg-slate-100 text-slate-700 border-slate-200/80 shadow-xs",
    purple:
      "bg-purple-50 text-purple-700 border-purple-200/80 shadow-xs",
  }[variant];

  const dotColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-rose-500",
    info: "bg-blue-500",
    neutral: "bg-slate-400",
    purple: "bg-purple-500",
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeStyles} ${variantStyles} ${className}`}
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
