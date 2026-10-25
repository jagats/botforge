"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#e0ece4] bg-[#ffffff] py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6b8f7e]">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-[#52796f]">— Multi-Tenant AI Bot-as-a-Service Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[#40916c] hover:underline font-semibold transition-colors">
            Portal Login
          </Link>
          <span>&copy; {new Date().getFullYear()} BotForge. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
