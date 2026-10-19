"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { PiSpinnerGap } from "react-icons/pi";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "secondary" | "ghost" | "danger" | "purple";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    // Base styles - capped at rounded-md (8px)
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#1E1A17] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

    // Size variants
    const sizeStyles = {
      sm: "text-sm px-3 py-2 gap-1.5",
      md: "text-md px-6 py-2 gap-2",
      lg: "text-lg px-10 py-3 gap-2.5",
    }[size];

    // Style variants (Dark Charcoal & Beige Design Refresh)
    const variantStyles = {
      primary:
        "bg-[#323232] hover:bg-[#1a1a1a] active:scale-[0.98] text-[#F5EDE8] border border-[rgba(221,208,200,0.20)] shadow-xs hover:shadow-[#323232]/50 focus:ring-[#DDD0C8]",
      accent:
        "bg-[#DDD0C8] hover:bg-[#C4B4A8] active:scale-[0.98] text-[#323232] font-semibold shadow-xs hover:shadow-[#DDD0C8]/25 focus:ring-[#323232]",
      secondary:
        "bg-[rgba(221,208,200,0.12)] hover:bg-[rgba(221,208,200,0.22)] active:scale-[0.98] text-[#DDD0C8] border border-[rgba(221,208,200,0.25)] shadow-xs focus:ring-[#DDD0C8] backdrop-blur-md",
      ghost:
        "bg-transparent hover:bg-[rgba(221,208,200,0.10)] text-[#C4B4A8] hover:text-[#F5EDE8] focus:ring-[#DDD0C8]",
      danger:
        "bg-rose-500/20 hover:bg-rose-500/30 active:scale-[0.98] text-rose-300 border border-rose-500/30 shadow-xs focus:ring-rose-400",
      purple:
        "bg-[#423a35] hover:bg-[#342e2a] active:scale-[0.98] text-[#DDD0C8] border border-[rgba(221,208,200,0.30)] shadow-xs focus:ring-[#DDD0C8]",
    }[variant];

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading ? (
          <PiSpinnerGap className="animate-spin -ml-0.5 text-current shrink-0" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
