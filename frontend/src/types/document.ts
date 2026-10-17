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
