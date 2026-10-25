"use client";

import React, { HTMLAttributes } from "react";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  elevated = false,
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

  const cardStyle = elevated ? "clay-card-elevated" : "clay-card";

  return (
    <div
      className={`${cardStyle} transition-all duration-200 ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
