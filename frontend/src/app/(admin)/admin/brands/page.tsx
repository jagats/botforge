"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useBrands } from "@/hooks/useBrands";
import { Brand } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BrandTable } from "@/components/brands/BrandTable";
import { BrandCreateForm } from "@/components/brands/BrandCreateForm";
import { BrandDeleteConfirm } from "@/components/brands/BrandDeleteConfirm";

export default function AdminBrandsPage() {
  const { brands, isLoading, refetch } = useBrands(0, 500);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  // Compute stats
  const totalCount = brands.length;
  const activeCount = brands.filter((b) => b.status === "active").length;
  const suspendedCount = brands.filter((b) => b.status === "suspended").length;
  const enterpriseCount = brands.filter((b) => b.plan === "enterprise").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Brands Management"
        description="Oversee multitenant brand accounts, provision new client workspaces, and monitor operational statuses."
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/brands/new">
              <Button variant="secondary" size="sm">
                Full Form
              </Button>
            </Link>
            <Button
              variant="purple"
              size="sm"
              onClick={() => setIsOnboardModalOpen(true)}
            >
              + Onboard Brand
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Brands
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {isLoading ? "..." : totalCount}
          </p>
        </GlassCard>

        <GlassCard className="p-4 hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Active Brands
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {isLoading ? "..." : activeCount}
          </p>
        </GlassCard>

        <GlassCard className="p-4 hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
            Suspended
          </p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {isLoading ? "..." : suspendedCount}
          </p>
        </GlassCard>

        <GlassCard className="p-4 hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
            Enterprise Tier
          </p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">
            {isLoading ? "..." : enterpriseCount}
          </p>
        </GlassCard>
      </div>

      {/* Brands Table */}
      <BrandTable
        brands={brands}
        isLoading={isLoading}
        onDeleteBrand={(brand) => setBrandToDelete(brand)}
        onOnboardClick={() => setIsOnboardModalOpen(true)}
      />

      {/* Onboard Brand Modal */}
      <Modal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        title="Provision New Client Brand"
        size="md"
      >
        <BrandCreateForm
          onSuccess={() => {
            setIsOnboardModalOpen(false);
            refetch();
          }}
          onCancel={() => setIsOnboardModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <BrandDeleteConfirm
        brand={brandToDelete}
        isOpen={!!brandToDelete}
        onClose={() => setBrandToDelete(null)}
        onDeleted={() => {
          setBrandToDelete(null);
          refetch();
        }}
      />
    </div>
  );
}
