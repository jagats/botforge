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
      <div
        style={{ width: dim, height: dim }}
        className="relative rounded-md overflow-hidden shrink-0 bg-[#323232] border border-[rgba(221,208,200,0.25)] shadow-xs"
      >
        <Image
          src="https://api.dicebear.com/9.x/bottts-neutral/svg?seed=botforge&backgroundColor=323232&scale=80"
          alt="BotForge"
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      {!collapsed && (
        <span className="text-sm font-bold tracking-tight text-[#F5EDE8] group-hover:text-[#DDD0C8] transition-colors">
          BotForge
        </span>
      )}
    </Link>
  );
};
