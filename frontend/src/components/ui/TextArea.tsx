"use client";

import React, { TextareaHTMLAttributes, forwardRef } from "react";
import { PiWarningCircleLight } from "react-icons/pi";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, className = "", id, disabled, rows = 4, ...props }, ref) => {
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

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          className={`w-full clay-input p-3.5 text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? "border-rose-400 text-rose-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-400/20"
              : "border-[#d8f3dc] focus:border-[#40916c] focus:ring-2 focus:ring-[#40916c]/20"
          } ${className}`}
          {...props}
        />

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

TextArea.displayName = "TextArea";
