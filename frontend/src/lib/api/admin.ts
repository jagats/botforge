import { apiFetch } from "./client";
import { Brand, BrandCreateInput, BrandListResponse } from "@/types";

export const adminApi = {
  listBrands: async (skip: number = 0, limit: number = 100): Promise<BrandListResponse> => {
    return apiFetch<BrandListResponse>(`/api/v1/admin/brands?skip=${skip}&limit=${limit}`);
  },

  getBrand: async (tenantId: string): Promise<Brand> => {
    return apiFetch<Brand>(`/api/v1/admin/brands/${tenantId}`);
  },

  createBrand: async (data: BrandCreateInput): Promise<Brand> => {
    return apiFetch<Brand>("/api/v1/admin/brands", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (tenantId: string, status: "active" | "suspended"): Promise<Brand> => {
    return apiFetch<Brand>(`/api/v1/admin/brands/${tenantId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  deleteBrand: async (tenantId: string): Promise<void> => {
    await apiFetch<void>(`/api/v1/admin/brands/${tenantId}`, {
      method: "DELETE",
    });
  },
};
