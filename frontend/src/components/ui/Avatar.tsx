"use client";

import React from "react";

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  role?: "user" | "bot" | "admin";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = "md",
  role = "user",
  className = "",
}) => {
  const sizeStyles = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  }[size];

  const getInitials = (str?: string) => {
    if (!str) return "?";
    const parts = str.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const roleStyles = {
    user: "bg-indigo-100 text-indigo-700 border-indigo-200",
    bot: "bg-emerald-100 text-emerald-700 border-emerald-200",
    admin: "bg-purple-100 text-purple-700 border-purple-200",
  }[role];

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`inline-block rounded-full object-cover border border-slate-200 shrink-0 ${sizeStyles} ${className}`}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center font-bold rounded-full border shrink-0 select-none ${sizeStyles} ${roleStyles} ${className}`}
    >
      {role === "bot" && !name ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ) : (
        getInitials(name)
      )}
    </div>
  );
};
