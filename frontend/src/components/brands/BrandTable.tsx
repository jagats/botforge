"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Brand } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { adminApi, getStoredToken, setStoredToken } from "@/lib/api";
import { PiTrashLight, PiMagnifyingGlassLight, PiArrowSquareOutLight } from "react-icons/pi";

export interface BrandTableProps {
  brands: Brand[];
  isLoading: boolean;
  onDeleteBrand: (brand: Brand) => void;
  onOnboardClick?: () => void;
}

export const BrandTable: React.FC<BrandTableProps> = ({
  brands,
  isLoading,
  onDeleteBrand,
  onOnboardClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [impersonatingTenantId, setImpersonatingTenantId] = useState<string | null>(null);
  const pageSize = 10;

  const handleViewDashboard = async (brand: Brand) => {
    try {
      setImpersonatingTenantId(brand.tenant_id);
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
      setImpersonatingTenantId(null);
    }
  };

  // Filter brands based on search & status
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const matchesSearch =
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.owner_email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && brand.is_active) ||
        (statusFilter === "suspended" && !brand.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [brands, searchQuery, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: "all" | "active" | "suspended") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalPages = Math.ceil(filteredBrands.length / pageSize) || 1;
  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBrands.slice(start, start + pageSize);
  }, [filteredBrands, currentPage, pageSize]);

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-72 rounded-md" />
          <Skeleton className="h-10 w-48 rounded-md" />
        </div>
        <div className="rounded-md glass-card p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            id="brand-search"
            type="text"
            placeholder="Search by brand name, slug, or email..."
            leftIcon={<PiMagnifyingGlassLight size={16} />}
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[rgba(221,208,200,0.08)] p-1 rounded-md border border-[rgba(221,208,200,0.18)]">
          {(
            [
              { label: "All Brands", value: "all" },
              { label: "Active", value: "active" },
              { label: "Suspended", value: "suspended" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusFilterChange(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer ${
                statusFilter === tab.value
                  ? "bg-[#323232] text-[#F5EDE8] shadow-sm border border-[rgba(221,208,200,0.25)] font-semibold"
                  : "text-[#C4B4A8] hover:text-[#F5EDE8]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brands Table or Empty State */}
      {filteredBrands.length === 0 ? (
        <div className="rounded-md glass-card p-8">
          <EmptyState
            title="No client brands found"
            description={
              searchQuery || statusFilter !== "all"
                ? "Try adjusting your search query or status filter."
                : "No client brands have been provisioned yet. Onboard your first brand to get started."
            }
            action={
              onOnboardClick
                ? {
                    label: "+ Onboard First Brand",
                    onClick: onOnboardClick,
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="rounded-md glass-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgba(221,208,200,0.15)] bg-[rgba(221,208,200,0.06)] text-[#C4B4A8] font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3.5 px-4 sm:px-6">Brand / Client</th>
                  <th className="py-3.5 px-4 sm:px-6">Owner Email</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Created</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(221,208,200,0.10)] text-[#F5EDE8]">
                {paginatedBrands.map((brand) => (
                  <tr
                    key={brand.tenant_id}
                    className="hover:bg-[rgba(221,208,200,0.06)] transition-colors group"
                  >
                    {/* Brand Info */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-[#323232] text-[#DDD0C8] border border-[rgba(221,208,200,0.25)] font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                          {brand.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#F5EDE8]">
                            {brand.name}
                          </div>
                          <div className="text-xs text-[#7A6E68] font-mono">
                            slug: {brand.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner Email */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs text-[#C4B4A8]">
                      {brand.owner_email}
                    </td>

                    {/* Plan Badge */}
                    <td className="py-3.5 px-4">
                      <Badge variant={getPlanBadgeVariant(brand.plan)} size="sm">
                        {brand.plan}
                      </Badge>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={brand.is_active ? "success" : "error"}
                        size="sm"
                        dot
                      >
                        {brand.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-xs text-[#7A6E68] hidden md:table-cell">
                      {formatDate(brand.created_at)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewDashboard(brand)}
                          isLoading={impersonatingTenantId === brand.tenant_id}
                          className="h-8 px-2.5 text-xs flex items-center gap-1.5 bg-[rgba(221,208,200,0.14)] hover:bg-[rgba(221,208,200,0.24)] text-[#F5EDE8] border border-[rgba(221,208,200,0.28)]"
                          title={`View & manage ${brand.name} dashboard`}
                        >
                          <PiArrowSquareOutLight size={14} className="text-[#DDD0C8]" />
                          <span>Dashboard</span>
                        </Button>
                        <Link href={`/admin/brands/${brand.tenant_id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 px-2.5 text-xs"
                          >
                            Inspect
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteBrand(brand)}
                          className="h-8 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
                          title="Purge brand"
                        >
                          <PiTrashLight size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-[rgba(221,208,200,0.15)] bg-[rgba(221,208,200,0.04)] text-xs text-[#7A6E68]">
              <div>
                Showing{" "}
                <span className="font-semibold text-[#F5EDE8]">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-[#F5EDE8]">
                  {Math.min(currentPage * pageSize, filteredBrands.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#F5EDE8]">
                  {filteredBrands.length}
                </span>{" "}
                brands
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 text-xs"
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-[#323232] text-[#F5EDE8] border border-[rgba(221,208,200,0.30)] shadow-xs"
                            : "text-[#C4B4A8] hover:bg-[rgba(221,208,200,0.10)]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span key={pageNum} className="text-[#7A6E68] px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
