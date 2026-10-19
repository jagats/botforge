"use client";

import React, { useEffect, useState } from "react";
import { setStoredToken } from "@/lib/api";
import { PiShieldWarningLight, PiArrowLeftLight } from "react-icons/pi";

interface ImpersonationData {
  brandName: string;
  tenantId: string;
  impersonatedBy?: string;
}

export const ImpersonationBanner: React.FC = () => {
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const backupToken = localStorage.getItem("botforge_admin_backup_token");
    if (!backupToken) {
      setImpersonation(null);
      return;
    }

    try {
      const raw = localStorage.getItem("botforge_impersonation");
      if (raw) {
        const parsed = JSON.parse(raw);
        setImpersonation(parsed);
      } else {
        setImpersonation({ brandName: "Client Account", tenantId: "" });
      }
    } catch {
      setImpersonation({ brandName: "Client Account", tenantId: "" });
    }
  }, []);

  const handleReturnToAdmin = () => {
    const backupToken = localStorage.getItem("botforge_admin_backup_token");
    if (backupToken) {
      setStoredToken(backupToken);
      localStorage.removeItem("botforge_admin_backup_token");
      localStorage.removeItem("botforge_impersonation");
    }
    window.location.href = "/admin/brands";
  };

  if (!impersonation) {
    return null;
  }

  return (
    <aside
      aria-label="Superadmin Impersonation Notice"
      className="sticky top-0 z-40 w-full bg-amber-500/15 border-b border-amber-500/35 backdrop-blur-md px-4 sm:px-6 py-2.5 transition-all shadow-md"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-200">
          <span className="p-1 rounded-sm bg-amber-500/20 text-amber-300 shrink-0">
            <PiShieldWarningLight size={18} />
          </span>
          <div className="leading-tight">
            <span className="font-bold text-amber-100 uppercase tracking-wider text-[11px] mr-1.5 px-1.5 py-0.5 rounded-xs bg-amber-500/25 border border-amber-400/40">
              Superadmin Mode
            </span>
            <span>
              Managing client workspace:{" "}
              <strong className="text-amber-100 underline decoration-amber-400/50">
                {impersonation.brandName}
              </strong>
              {impersonation.tenantId && (
                <span className="ml-1.5 font-mono text-[11px] text-amber-200/80">
                  ({impersonation.tenantId.slice(0, 8)}...)
                </span>
              )}
            </span>
            <span className="hidden md:inline text-amber-200/70 ml-2">
              — All actions and uploads take effect directly in client environment.
            </span>
          </div>
        </div>

        <button
          onClick={handleReturnToAdmin}
          className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border border-amber-400/40 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
        >
          <PiArrowLeftLight size={14} />
          <span>Return to Superadmin Portal</span>
        </button>
      </div>
    </aside>
  );
};
