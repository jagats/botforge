export interface User {
  user_id: string;
  tenant_id: string;
  email: string;
  role: string;
  is_active?: boolean;
  company_name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  tenant_id: string;
  role?: string;
  user_id?: string;
  token_type: string;
}
