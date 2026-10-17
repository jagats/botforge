import { apiFetch } from "./client";
import { ApiKey, Tenant } from "@/types";

export const tenantApi = {
  getProfile: async (): Promise<Tenant> => {
    return apiFetch<Tenant>("/api/v1/tenants/me");
  },

  updateProfile: async (data: { name: string }): Promise<Tenant> => {
    return apiFetch<Tenant>("/api/v1/tenants/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getApiKey: async (): Promise<ApiKey> => {
    return apiFetch<ApiKey>("/api/v1/tenants/me/api-key");
  },
};
