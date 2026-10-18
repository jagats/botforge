"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { PiWarningCircleLight } from "react-icons/pi";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "accent"}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {variant === "danger" && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <PiWarningCircleLight size={22} />
          </div>
        )}
        <p className="text-sm text-[#C4B4A8] leading-relaxed pt-1">{message}</p>
      </div>
    </Modal>
  );
};
