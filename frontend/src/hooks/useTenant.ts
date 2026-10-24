"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";

export const tenantQueryKeys = {
  profile: ["tenant", "profile"] as const,
  apiKey: ["tenant", "api-key"] as const,
};

interface UseTenantOptions {
  /** Fetch the widget public API key too. Off by default so pages that only need
   *  the profile (e.g. the dashboard overview) don't over-fetch (finding PERF-06/UI-01). */
  includeApiKey?: boolean;
}

export function useTenant(options: UseTenantOptions = {}) {
  const { includeApiKey = false } = options;
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: tenantQueryKeys.profile,
    queryFn: tenantApi.getProfile,
  });

  const apiKeyQuery = useQuery({
    queryKey: tenantQueryKeys.apiKey,
    queryFn: tenantApi.getApiKey,
    enabled: includeApiKey,
    retry: false, // a brand without a key returns 404 — don't retry it
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string }) => tenantApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantQueryKeys.profile });
    },
  });

  return {
    tenant: profileQuery.data,
    isLoadingProfile: profileQuery.isLoading,
    apiKey: apiKeyQuery.data,
    isLoadingApiKey: apiKeyQuery.isLoading,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    refetchProfile: profileQuery.refetch,
    refetchApiKey: apiKeyQuery.refetch,
  };
}
