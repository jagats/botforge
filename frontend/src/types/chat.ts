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
