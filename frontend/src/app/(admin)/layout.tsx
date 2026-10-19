"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SuperadminGuard } from "@/components/auth/SuperadminGuard";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/layout/Logo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <SuperadminGuard>
      <div className="min-h-screen bg-mesh text-[#F5EDE8] flex flex-col font-sans antialiased">
        {/* Top Admin Header */}
        <header className="sticky top-0 z-50 w-full glass-topbar border-b border-[rgba(221,208,200,0.15)]">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Logo size="md" href="/admin/brands" />
                <Badge variant="purple" size="sm">
                  Superadmin Portal
                </Badge>
              </div>

              <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-[rgba(221,208,200,0.15)]">
                <Link
                  href="/admin/brands"
                  className={`px-3.5 py-1.5 rounded-[4px] text-xs font-medium transition-colors ${
                    pathname === "/admin/brands"
                      ? "bg-[rgba(221,208,200,0.18)] text-[#F5EDE8] border border-[rgba(221,208,200,0.30)] font-semibold"
                      : "text-[#C4B4A8] hover:text-[#F5EDE8] hover:bg-[rgba(221,208,200,0.08)]"
                  }`}
                >
                  Client Brands
                </Link>
                <Link
                  href="/dashboard"
                  className="px-3.5 py-1.5 rounded-[4px] text-xs font-medium text-[#C4B4A8] hover:text-[#F5EDE8] hover:bg-[rgba(221,208,200,0.08)] transition-colors"
                >
                  Client Dashboard View →
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-[4px] bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.18)] text-xs shadow-2xs">
                  <span className="text-[#DDD0C8] font-medium">{user.email}</span>
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
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[#C4B4A8] hover:text-rose-400 hover:bg-rose-500/20 border border-transparent transition-all cursor-pointer"
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
