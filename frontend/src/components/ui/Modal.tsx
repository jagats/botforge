"use client";

import React, { useEffect, useCallback } from "react";
import { PiXLight } from "react-icons/pi";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}) => {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 modal-overlay transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${sizeStyles} bg-[#ffffff] border border-[#d8e2dc] p-6 shadow-xl rounded-2xl transition-all duration-300 animate-scale-in z-10 text-[#1b4332]`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#e0ece4]">
          <div>
            <h3
              id="modal-title"
              className="text-lg font-bold tracking-tight text-[#1b4332]"
            >
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-xs text-[#3f5e50] leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-1.5 text-[#52796f] hover:text-[#1b4332] hover:bg-[#f1faee] transition-colors focus:outline-none focus:ring-2 focus:ring-[#40916c] cursor-pointer"
          >
            <PiXLight size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 text-[#1b4332]">{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e0ece4]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
