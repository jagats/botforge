"use client";

import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import { useSidebar } from "@/contexts/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-mesh font-sans antialiased text-[#1b4332]">
        {/* Fixed Non-scrollable Sidebar */}
        <Sidebar />

        {/* Main Content Column adjusted for fixed sidebar */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isCollapsed ? "md:pl-20" : "md:pl-64"
          }`}
        >
          <ImpersonationBanner />
          <Topbar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
