"use client";

import React, { useState } from "react";
import { PiCopyLight, PiCheckLight } from "react-icons/pi";

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
    sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
    md: "px-4 py-2 text-sm gap-2 rounded-xl",
  }[size];

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center font-semibold border border-[#d8f3dc] bg-[#ffffff] text-[#3f5e50] hover:text-[#1b4332] hover:bg-[#f1faee] shadow-2xs transition-all active:scale-95 cursor-pointer ${sizeStyles} ${className}`}
    >
      {copied ? (
        <>
          <PiCheckLight size={14} className="text-[#40916c] shrink-0" />
          <span className="text-[#40916c] font-semibold">{label ? "Copied!" : "Copied"}</span>
        </>
      ) : (
        <>
          <PiCopyLight size={14} className="text-[#52796f] shrink-0" />
          <span>{label || "Copy"}</span>
        </>
      )}
    </button>
  );
};
