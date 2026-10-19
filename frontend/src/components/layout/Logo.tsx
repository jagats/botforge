"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  collapsed?: boolean;
  size?: "sm" | "md";
  className?: string;
  href?: string;
}

export const Logo = ({
  collapsed = false,
  size = "md",
  className = "",
  href = "/",
}: LogoProps) => {
  const dim = size === "sm" ? 28 : 32;
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 group shrink-0 select-none ${className}`}
    >
      {/* <div
        style={{ width: 60, height: 60 }}
        className="relative rounded-md overflow-hidden shrink-0 bg-[#323232] border border-[rgba(221,208,200,0.25)] shadow-xs"
      > */}
        <Image
          src="/assets/logo.png"
          alt="BotForge"
          width={50}
          height={50}
          className="object-cover object-center"
          unoptimized
        />
      {/* </div> */}
      {!collapsed && (
        <span className="text-lg italic tracking-tight text-text-primary group-hover:text-[#DDD0C8] transition-colors">
          BotForge
        </span>
      )}
    </Link>
  );
};
