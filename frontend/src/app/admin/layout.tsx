"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "superadmin") {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Verifying administrator privileges...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/brands" className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 text-lg">
                🛡️
              </span>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white leading-none">
                  BotForge
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-purple-400">
                  Superadmin Portal
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800">
              <Link
                href="/admin/brands"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/admin/brands"
                    ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                Client Brands
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
              >
                Client Dashboard View &rarr;
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-slate-300 font-medium">{user.email}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Superadmin
              </span>
            </div>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
