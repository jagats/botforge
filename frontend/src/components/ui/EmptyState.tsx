"use client";

import React from "react";
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
      className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-xs ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4 shadow-2xs">
        {icon || (
          <svg
            className="h-7 w-7 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>

      <h3 className="text-base font-bold text-slate-800 tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
        {description}
      </p>

      {action && (
        <div className="mt-5">
          <Button
            variant="primary"
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
