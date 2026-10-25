"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";
import { PiWarningCircleLight } from "react-icons/pi";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      className = "",
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#2d4a3e]"
          >
            {label}
          </label>
        )}

        <div className="relative rounded-xl">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#52796f]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full clay-input px-3.5 py-2.5 text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              leftIcon ? "pl-10" : ""
            } ${rightIcon ? "pr-10" : ""} ${
              error
                ? "border-rose-400 text-rose-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-400/20"
                : "border-[#d8f3dc] focus:border-[#40916c] focus:ring-2 focus:ring-[#40916c]/20"
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#52796f]">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-rose-500 animate-fade-in flex items-center gap-1">
            <PiWarningCircleLight className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {hint && !error && (
          <p className="text-xs text-[#6b8f7e]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
