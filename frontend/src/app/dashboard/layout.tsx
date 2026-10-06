"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-sm font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  interface NavItem {
    label: string;
    href: string;
    icon: string;
    badge?: string;
  }

  const navItems: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: "📊" },
    { label: "Documents", href: "/dashboard/documents", icon: "📄" },
    { label: "Chat Test", href: "/dashboard/chat-test", icon: "💬" },
    { label: "Settings & Embed", href: "/dashboard/settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen sticky top-0">
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="p-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 text-sm">
              🤖
            </span>
            <span>BotForge</span>
          </Link>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isDisabled = item.badge === "Phase 3";

            return (
              <Link
                key={item.href}
                href={isDisabled ? "#" : item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm"
                    : isDisabled
                    ? "text-slate-500 opacity-60 cursor-not-allowed pointer-events-none"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="px-1">
            <div className="text-xs font-semibold text-white truncate" title={user.email}>
              {user.email}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {user.company_name || "Workspace"}
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>🚪</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Bar */}
        <header className="h-16 px-8 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
          <div className="font-bold text-sm text-slate-200">
            {user.company_name} Workspace
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Role: <strong className="text-slate-200 uppercase font-semibold">{user.role}</strong>
            </span>
          </div>
        </header>

        {/* Body Content */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
