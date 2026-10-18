"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[rgba(221,208,200,0.15)] bg-[#1E1A17]/90 backdrop-blur-md py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A6E68]">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-[#C4B4A8]">— Multi-Tenant AI Bot-as-a-Service Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[#C4B4A8] hover:text-[#DDD0C8] transition-colors">
            Portal Login
          </Link>
          <span>&copy; {new Date().getFullYear()} BotForge. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
