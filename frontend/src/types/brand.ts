export interface Brand {
  tenant_id: string;
  name: string;
  slug: string;
  plan: string;
  status: "active" | "suspended";
  owner_email: string;
  owner_user_id: string;
  is_active: boolean;
  document_count: number;
  chat_session_count: number;
  public_api_key?: string | null;
  created_at: string;
}

export interface BrandListResponse {
  brands: Brand[];
  total: number;
}

export interface BrandCreateInput {
  company_name: string;
  email: string;
  password: string;
  plan?: string;
}

export interface BrandStatusUpdateInput {
  status: "active" | "suspended";
}
