"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/types";
import { BrandStatusToggle } from "./BrandStatusToggle";
import { BrandDeleteConfirm } from "./BrandDeleteConfirm";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { formatDate } from "@/lib/utils";
import { adminApi, getStoredToken, setStoredToken } from "@/lib/api";
import { PiWarningCircleLight, PiArrowSquareOutLight } from "react-icons/pi";

export interface BrandDetailProps {
  brand: Brand;
}

export const BrandDetail: React.FC<BrandDetailProps> = ({ brand }) => {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const handleViewDashboard = async () => {
    try {
      setIsImpersonating(true);
      const currentToken = getStoredToken();
      if (currentToken) {
        localStorage.setItem("botforge_admin_backup_token", currentToken);
      }
      const impersonateRes = await adminApi.impersonateBrand(brand.tenant_id);
      localStorage.setItem(
        "botforge_impersonation",
        JSON.stringify({
          brandName: impersonateRes.brand_name,
          tenantId: impersonateRes.tenant_id,
          impersonatedBy: impersonateRes.impersonated_by,
        })
      );
      setStoredToken(impersonateRes.access_token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Failed to enter client dashboard:", err);
      alert(err?.message || "Failed to enter client dashboard session.");
      setIsImpersonating(false);
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "enterprise":
        return "purple";
      case "pro":
        return "info";
      case "starter":
        return "neutral";
      default:
        return "warning";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/brands">
            <Button variant="secondary" size="sm" className="h-9 px-3">
              ← Back to Brands
            </Button>
          </Link>
          <div className="h-6 w-px bg-[rgba(221,208,200,0.15)]" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-[#323232] text-[#DDD0C8] border border-[rgba(221,208,200,0.20)] font-bold text-sm flex items-center justify-center shadow-xs">
              {brand.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5EDE8] leading-tight">
                {brand.name}
              </h2>
              <p className="text-xs text-[#7A6E68] font-mono">
                /{brand.slug}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewDashboard}
            isLoading={isImpersonating}
            className="h-9 px-3 text-xs flex items-center gap-1.5 bg-[rgba(221,208,200,0.14)] hover:bg-[rgba(221,208,200,0.24)] text-[#F5EDE8] border border-[rgba(221,208,200,0.28)]"
            title={`View & manage ${brand.name} dashboard`}
          >
            <PiArrowSquareOutLight size={15} className="text-[#DDD0C8]" />
            <span>Client Dashboard</span>
          </Button>
          <BrandStatusToggle brand={brand} />
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Purge Brand
          </Button>
        </div>
      </div>

      {/* Grid of Key Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tenant ID */}
        <GlassCard className="p-4 space-y-1.5 hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-[#C4B4A8] uppercase tracking-wider">
            Tenant ID
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold text-[#DDD0C8] truncate">
              {brand.tenant_id}
            </span>
            <CopyButton text={brand.tenant_id} size="sm" />
          </div>
        </GlassCard>

        {/* Owner Account */}
        <GlassCard className="p-4 space-y-1.5 hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-[#C4B4A8] uppercase tracking-wider">
            Owner Email
          </p>
          <p className="text-sm font-semibold text-[#F5EDE8] truncate">
            {brand.owner_email}
          </p>
        </GlassCard>

        {/* Plan Tier */}
        <GlassCard className="p-4 space-y-1.5 hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-[#C4B4A8] uppercase tracking-wider">
            Subscription Tier
          </p>
          <div className="flex items-center gap-2">
            <Badge
              variant={getPlanBadgeVariant(brand.plan)}
              size="md"
            >
              {brand.plan.toUpperCase()}
            </Badge>
          </div>
        </GlassCard>

        {/* Provisioned Date */}
        <GlassCard className="p-4 space-y-1.5 hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-[#C4B4A8] uppercase tracking-wider">
            Provisioned On
          </p>
          <p className="text-sm font-semibold text-[#F5EDE8]">
            {formatDate(brand.created_at)}
          </p>
        </GlassCard>
      </div>

      {/* Public API Key & Integration info */}
      {brand.public_api_key && (
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F5EDE8]">
                Public Client API Key
              </h3>
              <p className="text-xs text-[#C4B4A8]">
                Used by the client&apos;s embed script or external REST integrations to authenticate query requests.
              </p>
            </div>
            <CopyButton text={brand.public_api_key} size="sm" />
          </div>

          <div className="bg-[#1E1A17] text-[#DDD0C8] rounded-md p-3.5 font-mono text-xs overflow-x-auto border border-[rgba(221,208,200,0.20)] shadow-inner">
            <code>{brand.public_api_key}</code>
          </div>
        </GlassCard>
      )}

      {/* Danger Zone */}
      <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
            <PiWarningCircleLight size={18} className="text-rose-400" />
            <span>Danger Zone — Brand Offboarding</span>
          </h3>
          <p className="text-xs text-rose-200/80 mt-1">
            Permanently deletes this brand tenant, revoking all user credentials, flushing vector embeddings from Qdrant, and wiping document metadata.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Purge {brand.name}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <BrandDeleteConfirm
        brand={brand}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={() => {
          router.push("/admin/brands");
        }}
      />
    </div>
  );
};
