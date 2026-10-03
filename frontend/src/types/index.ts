/** Shared TypeScript interfaces for BotForge frontend */

export interface User {
  user_id: string;
  tenant_id: string;
  email: string;
  role: string;
  company_name: string;
}

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

export interface SignupInput {
  company_name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  tenant_id: string;
  user_id?: string;
  token_type: string;
}

export interface ApiError {
  detail: string | Array<{ msg: string; loc: string[] }>;
}
