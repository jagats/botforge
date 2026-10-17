"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SuperadminGuard } from "@/components/auth/SuperadminGuard";
import { Badge } from "@/components/ui/Badge";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <SuperadminGuard>
      <div className="min-h-screen bg-mesh text-slate-900 flex flex-col font-sans antialiased">
        {/* Top Admin Header */}
        <header className="sticky top-0 z-50 w-full glass-topbar border-b border-purple-200/50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin/brands" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs shadow-purple-500/30">
                  <span className="text-base font-bold">🛡️</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                    BotForge
                  </span>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-purple-700">
                    Superadmin Portal
                  </span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-200">
                <Link
                  href="/admin/brands"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === "/admin/brands"
                      ? "bg-purple-100 text-purple-800 border border-purple-200/80 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Client Brands
                </Link>
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Client Dashboard View →
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs shadow-2xs">
                  <span className="text-slate-700 font-medium">{user.email}</span>
                  <Badge variant="purple" size="sm">
                    Superadmin
                  </Badge>
                </div>
              )}

              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200/60 transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </SuperadminGuard>
  );
}
