import { apiFetch, setStoredToken, removeStoredToken } from "./client";
import { AuthTokens, LoginInput, User } from "@/types";

export const authApi = {
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
