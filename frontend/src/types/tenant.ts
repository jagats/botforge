export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  created_at: string;
}

export interface ApiKey {
  public_key: string;
  is_active: boolean;
  created_at: string;
}
