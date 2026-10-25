"use client";

import React from "react";
import { PiTrayLight } from "react-icons/pi";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-[#d8f3dc] bg-[#ffffff] shadow-sm ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#f1faee] text-[#40916c] mb-4 shadow-inner">
        {icon || <PiTrayLight size={32} className="text-[#40916c]" />}
      </div>

      <h3 className="text-base font-bold text-[#1b4332] tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-xs text-[#3f5e50] max-w-sm leading-relaxed">
        {description}
      </p>

      {action && (
        <div className="mt-5">
          <Button
            variant="accent"
            size="sm"
            onClick={action.onClick}
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};
