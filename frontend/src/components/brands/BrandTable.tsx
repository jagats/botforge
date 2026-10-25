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
import { adminApi } from "@/lib/api";
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
      const impersonateRes = await adminApi.impersonateBrand(brand.tenant_id);
      sessionStorage.setItem(
        "botforge_impersonation_meta",
        JSON.stringify({
          brandName: impersonateRes.brand_name,
          tenantId: impersonateRes.tenant_id,
          impersonatedBy: impersonateRes.impersonated_by,
        })
      );
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
          <Skeleton className="h-10 w-72 rounded-xl" />
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
        <div className="rounded-2xl clay-card p-4 space-y-3 bg-[#ffffff]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
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

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#ffffff] p-1 rounded-xl border border-[#d8f3dc] shadow-sm">
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                statusFilter === tab.value
                  ? "bg-[#40916c] text-[#ffffff] shadow-sm"
                  : "text-[#52796f] hover:text-[#1b4332] hover:bg-[#f1faee]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brands Table or Empty State */}
      {filteredBrands.length === 0 ? (
        <div className="rounded-2xl clay-card p-8 bg-[#ffffff]">
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
        <div className="rounded-2xl clay-card shadow-sm overflow-hidden bg-[#ffffff] border border-[#d8f3dc]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e0ece4] bg-[#f8fbf9] text-[#52796f] font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3.5 px-4 sm:px-6">Brand / Client</th>
                  <th className="py-3.5 px-4 sm:px-6">Owner Email</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Created</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1faee] text-[#1b4332]">
                {paginatedBrands.map((brand) => (
                  <tr
                    key={brand.tenant_id}
                    className="hover:bg-[#f8fbf9] transition-colors group"
                  >
                    {/* Brand Info */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#d8f3dc] text-[#1b4332] border border-[#b7e4c7] font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                          {brand.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#1b4332]">
                            {brand.name}
                          </div>
                          <div className="text-xs text-[#6b8f7e] font-mono">
                            slug: {brand.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner Email */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs text-[#3f5e50]">
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
                    <td className="py-3.5 px-4 text-xs text-[#6b8f7e] hidden md:table-cell">
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
                          className="h-8 px-2.5 text-xs flex items-center gap-1.5"
                          title={`View & manage ${brand.name} dashboard`}
                        >
                          <PiArrowSquareOutLight size={14} className="text-[#40916c]" />
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
                          className="h-8 px-2 text-[#52796f] hover:text-rose-600 hover:bg-rose-50"
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-[#e0ece4] bg-[#f8fbf9] text-xs text-[#6b8f7e]">
              <div>
                Showing{" "}
                <span className="font-semibold text-[#1b4332]">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-[#1b4332]">
                  {Math.min(currentPage * pageSize, filteredBrands.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#1b4332]">
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
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-[#40916c] text-[#ffffff] shadow-xs"
                            : "text-[#52796f] hover:bg-[#f1faee] hover:text-[#1b4332]"
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
                      <span key={pageNum} className="text-[#6b8f7e] px-1">
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
