"use client";

import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/70 bg-white/50 backdrop-blur-md py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
            B
          </div>
          <span className="font-semibold text-slate-700">BotForge</span>
          <span>— Multi-Tenant AI Bot-as-a-Service Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-indigo-600 transition-colors">
            Portal Login
          </Link>
          <span>&copy; {new Date().getFullYear()} BotForge. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
