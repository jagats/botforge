/** Shared TypeScript interfaces for BotForge frontend */

export interface User {
  user_id: string;
  tenant_id: string;
  email: string;
  role: string;
  is_active?: boolean;
  company_name: string;
}

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
  role?: string;
  user_id?: string;
  token_type: string;
}

export interface ApiError {
  detail: string | Array<{ msg: string; loc: string[] }>;
}

export interface Document {
  id: string;
  tenant_id: string;
  source_type: "pdf" | "url" | "faq_text";
  title: string;
  original_url?: string | null;
  status: "pending" | "processing" | "ready" | "failed";
  error_message?: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export interface UploadUrlInput {
  url: string;
  title?: string;
}

export interface UploadFaqInput {
  title: string;
  faq_text: string;
}

export interface ChatSourceItem {
  chunk_id: string;
  document_id: string;
  text: string;
  score: number;
}

export interface ChatRequest {
  session_id?: string | null;
  message: string;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  sources: string[];
  source_chunks: ChatSourceItem[];
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  retrieved_chunk_ids?: string[] | null;
  created_at: string;
}

export interface ChatSessionDetail {
  id: string;
  tenant_id: string;
  started_at: string;
  messages: ChatMessageItem[];
}
