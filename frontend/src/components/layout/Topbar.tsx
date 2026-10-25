"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { Badge, CopyButton } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { PiListLight, PiBellLight, PiShieldCheckLight, PiSignOutLight } from "react-icons/pi";

interface ImpersonationData {
  brandName: string;
  tenantId: string;
}

export const Topbar: React.FC = () => {
  const { user } = useAuth();
  const { openMobile } = useSidebar();
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("botforge_impersonation_meta");
      if (raw) {
        setImpersonation(JSON.parse(raw));
      } else {
        setImpersonation(null);
      }
    } catch {
      setImpersonation(null);
    }
  }, []);

  const handleReturnToAdmin = async () => {
    try {
      await adminApi.exitImpersonation();
    } catch {
      // Ignore network errors
    }
    sessionStorage.removeItem("botforge_impersonation_meta");
    window.location.href = "/admin/brands";
  };

  return (
    <header className="sticky top-0 z-20 h-16 clay-topbar bg-[#ffffff] px-4 sm:px-6 flex items-center justify-between border-b border-[#e0ece4]">
      {/* Left: Mobile hamburger & Workspace breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={openMobile}
          aria-label="Open navigation menu"
          className="md:hidden p-2 rounded-xl text-[#52796f] hover:text-[#1b4332] hover:bg-[#f1faee] transition-colors cursor-pointer"
        >
          <PiListLight size={22} />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-semibold text-[#6b8f7e]">
            Workspace:
          </span>
          <span className="text-xs font-bold text-[#1b4332]">
            {user?.company_name || "Client Portal"}
          </span>
        </div>
      </div>

      {/* Right: Impersonation quick exit (if active), Tenant ID info & status pill */}
      <div className="flex items-center gap-3">
        {impersonation && (
          <button
            onClick={handleReturnToAdmin}
            title="Exit client view and return to Superadmin console"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d8f3dc] hover:bg-[#b7e4c7] text-[#1b4332] border border-[#95d5b2] font-semibold text-xs transition-all cursor-pointer shadow-2xs"
          >
            <PiShieldCheckLight size={15} className="text-[#2d6a4f]" />
            <span className="hidden sm:inline">Superadmin:</span>
            <span>Exit to Console</span>
          </button>
        )}

        {user?.tenant_id && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f8fbf9] border border-[#d8f3dc] text-[11px] font-mono text-[#1b4332] shadow-2xs">
            <span className="text-[#6b8f7e]">ID:</span>
            <span className="truncate max-w-30 font-semibold">{user.tenant_id}</span>
            <CopyButton text={user.tenant_id} size="sm" className="p-0.5! border-0! bg-transparent! text-[#6b8f7e] hover:text-[#1b4332]" />
          </div>
        )}

        <button
          aria-label="Notifications"
          className="p-2 rounded-xl text-[#52796f] hover:text-[#1b4332] hover:bg-[#f1faee] transition-colors cursor-pointer"
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
