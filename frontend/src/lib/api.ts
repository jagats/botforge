/** API Client for BotForge backend services. All frontend network calls route through this module. */

import {
  ApiKey,
  AuthTokens,
  Document,
  DocumentListResponse,
  LoginInput,
  SignupInput,
  Tenant,
  UploadFaqInput,
  UploadUrlInput,
  User,
} from "../types";

const TOKEN_KEY = "botforge_access_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeStoredToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  // Set default JSON Content-Type only if not sending FormData
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        errorMessage = errorData.detail.map((d: { msg: string }) => d.msg).join(", ");
      }
    } catch {
      // Fallback to HTTP status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/** Authentication API endpoints */
export const authApi = {
  signup: async (data: SignupInput): Promise<AuthTokens> => {
    const res = await apiFetch<AuthTokens>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setStoredToken(res.access_token);
    return res;
  },

  login: async (data: LoginInput): Promise<AuthTokens> => {
    const res = await apiFetch<AuthTokens>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setStoredToken(res.access_token);
    return res;
  },

  getMe: async (): Promise<User> => {
    return apiFetch<User>("/api/v1/auth/me");
  },

  logout: (): void => {
    removeStoredToken();
  },
};

/** Tenant and settings API endpoints */
export const tenantApi = {
  getProfile: async (): Promise<Tenant> => {
    return apiFetch<Tenant>("/api/v1/tenants/me");
  },

  updateProfile: async (data: { name: string }): Promise<Tenant> => {
    return apiFetch<Tenant>("/api/v1/tenants/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getApiKey: async (): Promise<ApiKey> => {
    return apiFetch<ApiKey>("/api/v1/tenants/me/api-key");
  },
};

/** Document management API endpoints */
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
