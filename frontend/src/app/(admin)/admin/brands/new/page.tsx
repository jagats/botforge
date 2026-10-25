"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { BrandCreateForm } from "@/components/brands/BrandCreateForm";

export default function NewBrandPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/brands">
          <Button variant="secondary" size="sm" className="h-8 px-2.5">
            Back to Brands
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Provision Client Brand"
        description="Onboard an enterprise or trial brand tenant with dedicated vector partition and administrator credentials."
      />

      <GlassCard className="p-6 sm:p-8">
        <BrandCreateForm
          onSuccess={(newBrand) => {
            router.push(`/admin/brands/${newBrand.tenant_id}`);
          }}
          onCancel={() => {
            router.push("/admin/brands");
          }}
        />
      </GlassCard>
    </div>
  );
}
