"use client";

import React, { useState } from "react";

export interface CopyButtonProps {
  text: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label,
  size = "sm",
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
  }[size];

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center font-medium rounded-lg border border-slate-200 bg-white/90 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-2xs transition-all active:scale-95 cursor-pointer backdrop-blur-xs ${sizeStyles} ${className}`}
    >
      {copied ? (
        <>
          <svg
            className="h-3.5 w-3.5 text-emerald-600 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-emerald-700 font-semibold">{label ? "Copied!" : "Copied"}</span>
        </>
      ) : (
        <>
          <svg
            className="h-3.5 w-3.5 text-slate-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span>{label || "Copy"}</span>
        </>
      )}
    </button>
  );
};
