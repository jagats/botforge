"use client";

import React, { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { PiShieldCheckLight, PiSignOutLight } from "react-icons/pi";

interface ImpersonationData {
  brandName: string;
  tenantId: string;
  impersonatedBy?: string;
}

export const ImpersonationBanner: React.FC = () => {
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("botforge_impersonation_meta");
      if (raw) {
        const parsed = JSON.parse(raw);
        setImpersonation(parsed);
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
      // Ignore network errors on exit
    }
    sessionStorage.removeItem("botforge_impersonation_meta");
    window.location.href = "/admin/brands";
  };

  if (!impersonation) {
    return null;
  }

  return (
    <aside
      aria-label="Superadmin Impersonation Notice"
      className="bg-[#ffffff] border-b border-[#d8f3dc] px-4 sm:px-6 py-2 shadow-xs transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-[#1b4332]">
          <span className="p-1 rounded-lg bg-[#d8f3dc] text-[#2d6a4f] shrink-0">
            <PiShieldCheckLight size={16} />
          </span>
          <div className="leading-tight">
            <span className="font-bold text-[#1b4332] uppercase tracking-wider text-[11px] mr-1.5 px-2 py-0.5 rounded-md bg-[#d8f3dc] border border-[#b7e4c7]">
              Superadmin Mode
            </span>
            <span className="text-[#3f5e50]">
              Viewing workspace for{" "}
              <strong className="text-[#1b4332] font-semibold">
                {impersonation.brandName}
              </strong>
            </span>
          </div>
        </div>

        <button
          onClick={handleReturnToAdmin}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d8f3dc] hover:bg-[#b7e4c7] text-[#1b4332] border border-[#95d5b2] font-semibold text-xs transition-all cursor-pointer shadow-2xs"
        >
          <PiSignOutLight size={15} className="text-[#2d6a4f]" />
          <span>Exit to Superadmin Console</span>
        </button>
      </div>
    </aside>
  );
};
