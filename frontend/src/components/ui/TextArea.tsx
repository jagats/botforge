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
            className="block text-xs font-semibold uppercase tracking-wider text-[#C4B4A8]"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          className={`w-full rounded-md border bg-[rgba(221,208,200,0.08)] p-3.5 text-sm text-[#F5EDE8] placeholder:text-[rgba(196,180,168,0.50)] transition-all duration-150 backdrop-blur-xs disabled:opacity-50 disabled:bg-[rgba(30,26,23,0.5)] disabled:cursor-not-allowed ${
            error
              ? "border-rose-400/80 text-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
              : "border-[rgba(221,208,200,0.25)] hover:border-[rgba(221,208,200,0.40)] focus:border-[#DDD0C8] focus:bg-[rgba(221,208,200,0.12)] focus:outline-none focus:ring-2 focus:ring-[#DDD0C8]/20"
          } ${className}`}
          {...props}
        />

        {error && (
          <p className="text-xs font-medium text-rose-400 animate-fade-in flex items-center gap-1">
            <PiWarningCircleLight className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {hint && !error && (
          <p className="text-xs text-[#7A6E68]">{hint}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
