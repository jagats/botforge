"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "purple";
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
    // Base styles
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

    // Size variants
    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3 gap-2.5",
    }[size];

    // Style variants (light-glassmorphic aligned)
    const variantStyles = {
      primary:
        "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-sm hover:shadow-indigo-500/25 focus:ring-indigo-500",
      secondary:
        "bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-xs focus:ring-slate-400 backdrop-blur-md",
      ghost:
        "bg-transparent hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 focus:ring-slate-400",
      danger:
        "bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white shadow-sm hover:shadow-rose-500/25 focus:ring-rose-500",
      purple:
        "bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white shadow-sm hover:shadow-purple-500/25 focus:ring-purple-500",
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
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
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
