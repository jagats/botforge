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
    text: "h-4 rounded-xl w-full",
    circular: "rounded-full shrink-0",
    rectangular: "rounded-xl",
  }[variant];

  const inlineStyles: React.CSSProperties = {
    width: width,
    height: height,
    ...style,
  };

  return (
    <div
      className={`animate-shimmer bg-[#d8f3dc]/30 border border-[#b7e4c7]/30 ${variantStyles} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
};
