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
    // Claymorphism base styles
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#40916c] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

    // Size variants
    const sizeStyles = {
      sm: "text-xs px-3.5 py-1.5 gap-1.5 rounded-lg",
      md: "text-sm px-5 py-2.5 gap-2 rounded-xl",
      lg: "text-base px-7 py-3.5 gap-2.5 rounded-2xl",
    }[size];

    // Style variants (Claymorphism with Mint & Forest Palette)
    const variantStyles = {
      primary:
        "clay-btn-primary active:scale-[0.98]",
      accent:
        "clay-btn-primary active:scale-[0.98]",
      secondary:
        "clay-btn-secondary active:scale-[0.98]",
      ghost:
        "bg-transparent hover:bg-[#d8f3dc]/50 text-[#3f5e50] hover:text-[#1b4332] focus:ring-[#40916c]",
      danger:
        "bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] border border-[#fca5a5] shadow-xs active:scale-[0.98] focus:ring-[#e63946]",
      purple:
        "bg-[#d8f3dc] hover:bg-[#b7e4c7] text-[#1b4332] border border-[#95d5b2] shadow-xs active:scale-[0.98] focus:ring-[#40916c]",
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
