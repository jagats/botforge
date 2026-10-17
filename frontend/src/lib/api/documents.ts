import { apiFetch } from "./client";
import { Document, DocumentListResponse, UploadFaqInput, UploadUrlInput } from "@/types";

export const documentApi = {
  list: async (): Promise<DocumentListResponse> => {
    return apiFetch<DocumentListResponse>("/api/v1/documents");
  },

  get: async (id: string): Promise<Document> => {
    return apiFetch<Document>(`/api/v1/documents/${id}`);
  },

  uploadPdf: async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<Document>("/api/v1/documents/upload", {
      method: "POST",
      body: formData,
    });
  },

  uploadUrl: async (data: UploadUrlInput): Promise<Document> => {
    return apiFetch<Document>("/api/v1/documents/url", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  uploadFaq: async (data: UploadFaqInput): Promise<Document> => {
    return apiFetch<Document>("/api/v1/documents/faq", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/api/v1/documents/${id}`, {
      method: "DELETE",
    });
  },
};
