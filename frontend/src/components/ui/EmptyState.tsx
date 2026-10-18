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
      className={`flex flex-col items-center justify-center p-12 text-center rounded-md border border-[rgba(221,208,200,0.18)] bg-[rgba(221,208,200,0.06)] backdrop-blur-md ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[rgba(221,208,200,0.12)] text-[#C4B4A8] mb-4 shadow-2xs">
        {icon || <PiTrayLight size={32} className="text-[#C4B4A8]" />}
      </div>

      <h3 className="text-base font-bold text-[#F5EDE8] tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-xs text-[#C4B4A8] max-w-sm leading-relaxed">
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
