"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { BrandCreateInput } from "@/types";

export const brandQueryKeys = {
  all: ["brands"] as const,
  detail: (id: string) => ["brands", id] as const,
};

export function useBrands(skip: number = 0, limit: number = 200) {
  const queryClient = useQueryClient();

  const brandsQuery = useQuery({
    queryKey: [...brandQueryKeys.all, skip, limit],
    queryFn: () => adminApi.listBrands(skip, limit),
  });

  const useBrandDetail = (tenantId: string) => {
    return useQuery({
      queryKey: brandQueryKeys.detail(tenantId),
      queryFn: () => adminApi.getBrand(tenantId),
      enabled: !!tenantId,
    });
  };

  const createBrandMutation = useMutation({
    mutationFn: (data: BrandCreateInput) => adminApi.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandQueryKeys.all });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      tenantId,
      status,
    }: {
      tenantId: string;
      status: "active" | "suspended";
    }) => adminApi.updateStatus(tenantId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: brandQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: brandQueryKeys.detail(variables.tenantId),
      });
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (tenantId: string) => adminApi.deleteBrand(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandQueryKeys.all });
    },
  });

  return {
    brands: brandsQuery.data?.brands || [],
    total: brandsQuery.data?.total || 0,
    isLoading: brandsQuery.isLoading,
    isFetching: brandsQuery.isFetching,
    refetch: brandsQuery.refetch,
    useBrandDetail,
    createBrand: createBrandMutation.mutateAsync,
    isCreating: createBrandMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    deleteBrand: deleteBrandMutation.mutateAsync,
    isDeleting: deleteBrandMutation.isPending,
  };
}
