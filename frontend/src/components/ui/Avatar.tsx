"use client";

import React from "react";
import { PiRobotLight } from "react-icons/pi";

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
    user: "bg-[#d8f3dc] text-[#1b4332] border-[#b7e4c7]",
    bot: "bg-[#40916c] text-[#ffffff] border-[#2d6a4f]",
    admin: "bg-[#1b4332] text-[#ffffff] border-[#40916c]",
  }[role];

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`inline-block rounded-full object-cover border border-[#b7e4c7] shrink-0 ${sizeStyles} ${className}`}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center font-bold rounded-full border shrink-0 select-none ${sizeStyles} ${roleStyles} ${className}`}
    >
      {role === "bot" && !name ? (
        <PiRobotLight size={18} />
      ) : (
        getInitials(name)
      )}
    </div>
  );
};
