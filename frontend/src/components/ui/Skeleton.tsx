"use client";

import React, { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rectangular",
  width,
  height,
  className = "",
  style,
  ...props
}) => {
  const variantStyles = {
    text: "h-4 rounded-md w-full",
    circular: "rounded-full shrink-0",
    rectangular: "rounded-md",
  }[variant];

  const inlineStyles: React.CSSProperties = {
    width: width,
    height: height,
    ...style,
  };

  return (
    <div
      className={`animate-shimmer bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.12)] ${variantStyles} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
};
