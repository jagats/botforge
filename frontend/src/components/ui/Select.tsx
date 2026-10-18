"use client";

import React, { SelectHTMLAttributes, forwardRef } from "react";
import { PiCaretDownLight, PiWarningCircleLight } from "react-icons/pi";

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className = "", id, disabled, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#C4B4A8]"
          >
            {label}
          </label>
        )}

        <div className="relative rounded-md shadow-xs">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`w-full appearance-none rounded-md border bg-[#232020] px-3.5 py-2.5 pr-10 text-sm text-[#F5EDE8] transition-all duration-150 backdrop-blur-xs disabled:opacity-50 disabled:bg-[#1E1A17] disabled:cursor-not-allowed ${
              error
                ? "border-rose-400/80 text-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                : "border-[rgba(221,208,200,0.25)] hover:border-[rgba(221,208,200,0.40)] focus:border-[#DDD0C8] focus:outline-none focus:ring-2 focus:ring-[#DDD0C8]/20"
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={String(opt.value)} value={opt.value} disabled={opt.disabled} className="bg-[#232020] text-[#F5EDE8]">
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#C4B4A8]">
            <PiCaretDownLight className="h-4 w-4" />
          </div>
        </div>

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

Select.displayName = "Select";
