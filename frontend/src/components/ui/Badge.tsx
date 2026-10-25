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
    sm: "px-2.5 py-0.5 text-xs gap-1.5",
    md: "px-3.5 py-1 text-xs gap-2",
  }[size];

  const variantStyles = {
    success:
      "bg-[#d8f3dc] text-[#2d6a4f] border-[#b7e4c7] shadow-2xs font-semibold",
    warning:
      "bg-[#fef3c7] text-[#b45309] border-[#fde68a] shadow-2xs font-semibold",
    error:
      "bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5] shadow-2xs font-semibold",
    info:
      "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd] shadow-2xs font-semibold",
    neutral:
      "bg-[#f1faee] text-[#3f5e50] border-[#d8e2dc] shadow-2xs font-semibold",
    purple:
      "bg-[#d8f3dc] text-[#1b4332] border-[#95d5b2] shadow-2xs font-bold",
  }[variant];

  const dotColors = {
    success: "bg-[#40916c]",
    warning: "bg-[#f59e0b]",
    error: "bg-[#ef4444]",
    info: "bg-[#0284c7]",
    neutral: "bg-[#52796f]",
    purple: "bg-[#2d6a4f]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-lg border ${sizeStyles} ${variantStyles} ${className}`}
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
