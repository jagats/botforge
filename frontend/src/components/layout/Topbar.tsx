"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { Badge, CopyButton } from "@/components/ui";
import { PiListLight, PiBellLight } from "react-icons/pi";

export const Topbar: React.FC = () => {
  const { user } = useAuth();
  const { openMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-20 h-16 glass-topbar px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Workspace breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={openMobile}
          aria-label="Open navigation menu"
          className="md:hidden p-2 rounded-md text-[#C4B4A8] hover:text-text-primary hover:bg-[rgba(221,208,200,0.10)] transition-colors cursor-pointer"
        >
          <PiListLight size={22} />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-medium text-text-tertiary">
            Workspace:
          </span>
          <span className="text-xs font-bold text-text-primary">
            {user?.company_name || "Client Portal"}
          </span>
        </div>
      </div>

      {/* Right: Tenant ID info & status pill */}
      <div className="flex items-center gap-3">
        {user?.tenant_id && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.18)] text-[11px] font-mono text-text-primary">
            <span className="text-text-tertiary">ID:</span>
            <span className="truncate max-w-30">{user.tenant_id}</span>
            <CopyButton text={user.tenant_id} size="sm" className="p-0.5! border-0! bg-transparent! text-text-tertiary hover:text-text-primary" />
          </div>
        )}

        <button
          aria-label="Notifications"
          className="p-1.5 rounded-md text-[#C4B4A8] hover:text-text-pr hover:bg-[rgba(221,208,200,0.10)] transition-colors cursor-pointer"
        >
          <PiBellLight size={18} />
        </button>

        <Badge variant="success" size="sm" dot>
          Active
        </Badge>
      </div>
    </header>
  );
};
