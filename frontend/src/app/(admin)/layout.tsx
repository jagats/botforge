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
      <div className="min-h-screen bg-mesh text-[#1b4332] flex flex-col font-sans antialiased">
        {/* Top Admin Header */}
        <header className="sticky top-0 z-50 w-full bg-[#ffffff] border-b border-[#e0ece4] shadow-xs">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Logo size="md" href="/admin/brands" />
                <Badge variant="purple" size="sm">
                  Superadmin Portal
                </Badge>
              </div>

              <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-[#d8f3dc]">
                <Link
                  href="/admin/brands"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname.startsWith("/admin/brands")
                      ? "bg-[#40916c] text-[#ffffff] shadow-xs"
                      : "text-[#3f5e50] hover:text-[#1b4332] hover:bg-[#f1faee]"
                  }`}
                >
                  Client Brands
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#f8fbf9] border border-[#d8f3dc] text-xs shadow-2xs">
                  <span className="text-[#1b4332] font-semibold">{user.email}</span>
                  <Badge variant="purple" size="sm">
                    Superadmin
                  </Badge>
                </div>
              )}

              <button
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#52796f] hover:text-rose-600 hover:bg-rose-50 border border-transparent transition-all cursor-pointer"
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
