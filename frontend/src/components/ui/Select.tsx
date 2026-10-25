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
            className="block text-xs font-semibold uppercase tracking-wider text-[#2d4a3e]"
          >
            {label}
          </label>
        )}

        <div className="relative rounded-xl">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`w-full appearance-none clay-input px-3.5 py-2.5 pr-10 text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              error
                ? "border-rose-400 text-rose-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-400/20"
                : "border-[#d8f3dc] focus:border-[#40916c] focus:ring-2 focus:ring-[#40916c]/20"
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={String(opt.value)} value={opt.value} disabled={opt.disabled} className="bg-[#ffffff] text-[#1b4332]">
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#52796f]">
            <PiCaretDownLight className="h-4 w-4" />
          </div>
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

Select.displayName = "Select";
