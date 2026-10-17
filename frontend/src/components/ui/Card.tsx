"use client";

import React, { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  padding = "md",
  className = "",
  children,
  ...props
}) => {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }[padding];

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm transition-all duration-200 ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
