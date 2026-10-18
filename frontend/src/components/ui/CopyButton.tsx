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
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
  }[size];

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center font-medium rounded-md border border-[rgba(221,208,200,0.22)] bg-[rgba(221,208,200,0.10)] text-[#DDD0C8] hover:text-[#F5EDE8] hover:border-[rgba(221,208,200,0.40)] shadow-2xs transition-all active:scale-95 cursor-pointer backdrop-blur-xs ${sizeStyles} ${className}`}
    >
      {copied ? (
        <>
          <PiCheckLight size={14} className="text-[#4ADE80] shrink-0" />
          <span className="text-[#4ADE80] font-semibold">{label ? "Copied!" : "Copied"}</span>
        </>
      ) : (
        <>
          <PiCopyLight size={14} className="text-[#C4B4A8] shrink-0" />
          <span>{label || "Copy"}</span>
        </>
      )}
    </button>
  );
};
