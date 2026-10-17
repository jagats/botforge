"use client";

import React from "react";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  size = "md",
  className = "",
}) => {
  const switchSizes = {
    sm: "w-8 h-4",
    md: "w-11 h-6",
  }[size];

  const thumbSizes = {
    sm: "h-3 w-3 translate-x-4",
    md: "h-5 w-5 translate-x-5",
  }[size];

  const thumbBase = {
    sm: "h-3 w-3 translate-x-0.5",
    md: "h-5 w-5 translate-x-0.5",
  }[size];

  return (
    <label
      className={`inline-flex items-center gap-2.5 select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex shrink-0 ${switchSizes} items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
          checked ? "bg-indigo-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block transform rounded-full bg-white shadow-xs transition duration-200 ${
            checked ? thumbSizes : thumbBase
          }`}
        />
      </button>

      {label && (
        <span className="text-xs font-medium text-slate-700">{label}</span>
      )}
    </label>
  );
};
