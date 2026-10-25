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
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 group shrink-0 select-none ${className}`}
    >
      <Image
        src="/assets/logo.png"
        alt="BotForge"
        width={42}
        height={42}
        className="object-cover object-center shrink-0"
        unoptimized
      />
      {!collapsed && (
        <span className="text-xl font-bold tracking-tight text-[#1b4332] group-hover:text-[#40916c] transition-colors">
          BotForge
        </span>
      )}
    </Link>
  );
};
