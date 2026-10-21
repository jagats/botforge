import { apiFetch } from "./client";
import { AuthTokens, LoginInput, User } from "@/types";

export const authApi = {
  login: async (data: LoginInput): Promise<AuthTokens> => {
    return apiFetch<AuthTokens>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMe: async (roleHint?: string): Promise<User> => {
    const headers: Record<string, string> = {};
    if (roleHint) {
      headers["X-Auth-Role"] = roleHint;
    }
    return apiFetch<User>("/api/v1/auth/me", {
      headers,
    });
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch("/api/v1/auth/logout", {
        method: "POST",
      });
    } catch {
      // Ignore network errors during logout
    }
  },
};
