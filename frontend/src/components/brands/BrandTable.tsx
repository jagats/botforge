"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Brand } from "@/types";
import { BrandStatusToggle } from "./BrandStatusToggle";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";

export interface BrandTableProps {
  brands: Brand[];
  isLoading?: boolean;
  onDeleteBrand: (brand: Brand) => void;
  onOnboardClick?: () => void;
}

export const BrandTable: React.FC<BrandTableProps> = ({
  brands,
  isLoading = false,
  onDeleteBrand,
  onOnboardClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter brands
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        brand.name.toLowerCase().includes(q) ||
        brand.slug.toLowerCase().includes(q) ||
        brand.owner_email.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || brand.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [brands, searchQuery, statusFilter]);

  // Reset to first page on search or filter change
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
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 space-y-3">
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
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                statusFilter === tab.value
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brands Table or Empty State */}
      {filteredBrands.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-md p-8">
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
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3.5 px-4 sm:px-6">Brand / Client</th>
                  <th className="py-3.5 px-4 sm:px-6">Owner Email</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Created</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedBrands.map((brand) => (
                  <tr
                    key={brand.tenant_id}
                    className="hover:bg-indigo-50/40 transition-colors group"
                  >
                    {/* Brand Info */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                          {brand.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/admin/brands/${brand.tenant_id}`}
                            className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors"
                          >
                            {brand.name}
                          </Link>
                          <div className="text-xs text-slate-600 font-mono flex items-center gap-1">
                            <span>/{brand.slug}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner Email */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-600">
                      {brand.owner_email}
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={getPlanBadgeVariant(brand.plan)}
                        size="sm"
                      >
                        {brand.plan.toUpperCase()}
                      </Badge>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <BrandStatusToggle brand={brand} />
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 hidden md:table-cell">
                      {formatDate(brand.created_at)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                          className="h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          title="Purge brand"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
              <div>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(currentPage * pageSize, filteredBrands.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
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
                  // Show current, first, last, and neighbors
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
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-200/60"
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
                      <span key={pageNum} className="text-slate-400 px-1">
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
