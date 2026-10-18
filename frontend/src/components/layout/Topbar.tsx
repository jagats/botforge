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
          className="md:hidden p-2 rounded-md text-[#C4B4A8] hover:text-[#F5EDE8] hover:bg-[rgba(221,208,200,0.10)] transition-colors cursor-pointer"
        >
          <PiListLight size={22} />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-medium text-[#7A6E68]">
            Workspace:
          </span>
          <span className="text-xs font-bold text-[#F5EDE8]">
            {user?.company_name || "Client Portal"}
          </span>
        </div>
      </div>

      {/* Right: Tenant ID info & status pill */}
      <div className="flex items-center gap-3">
        {user?.tenant_id && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.18)] text-[11px] font-mono text-[#DDD0C8]">
            <span className="text-[#7A6E68]">ID:</span>
            <span className="truncate max-w-[120px]">{user.tenant_id}</span>
            <CopyButton text={user.tenant_id} size="sm" className="!p-0.5 !border-0 !bg-transparent text-[#C4B4A8] hover:text-[#F5EDE8]" />
          </div>
        )}

        <button
          aria-label="Notifications"
          className="p-1.5 rounded-md text-[#C4B4A8] hover:text-[#F5EDE8] hover:bg-[rgba(221,208,200,0.10)] transition-colors cursor-pointer"
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
