"use client";

import React, { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { BrandDetail } from "@/components/brands/BrandDetail";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export interface BrandDetailPageProps {
  params: Promise<{ tenantId: string }>;
}

export default function AdminBrandDetailPage({ params }: BrandDetailPageProps) {
  const { tenantId } = use(params);

  const {
    data: brand,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["brands", tenantId],
    queryFn: () => adminApi.getBrand(tenantId),
    enabled: !!tenantId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-500 font-medium">Loading brand details...</p>
      </div>
    );
  }

  if (isError || !brand) {
    return (
      <div className="py-12">
        <EmptyState
          title="Brand Not Found"
          description={
            (error as any)?.message ||
            `The requested brand with ID "${tenantId}" could not be located.`
          }
          action={{
            label: "Return to Brands",
            onClick: () => {
              window.location.href = "/admin/brands";
            },
          }}
        />
      </div>
    );
  }

  return <BrandDetail brand={brand} />;
}
