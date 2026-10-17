"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";

export const tenantQueryKeys = {
  profile: ["tenant", "profile"] as const,
  apiKey: ["tenant", "api-key"] as const,
};

export function useTenant() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: tenantQueryKeys.profile,
    queryFn: tenantApi.getProfile,
  });

  const apiKeyQuery = useQuery({
    queryKey: tenantQueryKeys.apiKey,
    queryFn: tenantApi.getApiKey,
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
