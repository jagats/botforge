"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { Badge, CopyButton } from "@/components/ui";

export const Topbar: React.FC = () => {
  const { user } = useAuth();
  const { openMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-20 h-16 glass-topbar px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Tenant breadcrumb indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={openMobile}
          aria-label="Open navigation menu"
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-500">
            Workspace:
          </span>
          <span className="text-xs font-bold text-slate-800">
            {user?.company_name || "Client Portal"}
          </span>
        </div>
      </div>

      {/* Right: Tenant ID info & status pill */}
      <div className="flex items-center gap-3">
        {user?.tenant_id && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60 text-[11px] font-mono text-slate-600">
            <span>ID:</span>
            <span className="truncate max-w-[120px]">{user.tenant_id}</span>
            <CopyButton text={user.tenant_id} size="sm" className="!p-0.5 !border-0 !bg-transparent" />
          </div>
        )}

        <Badge variant="success" size="sm" dot>
          Active
        </Badge>
      </div>
    </header>
  );
};
