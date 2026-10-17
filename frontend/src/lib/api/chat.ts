import { apiFetch } from "./client";
import { ChatRequest, ChatResponse, ChatSessionDetail } from "@/types";

export const chatApi = {
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    return apiFetch<ChatResponse>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getSession: async (sessionId: string): Promise<ChatSessionDetail> => {
    return apiFetch<ChatSessionDetail>(`/api/v1/chat/sessions/${sessionId}`);
  },
};
