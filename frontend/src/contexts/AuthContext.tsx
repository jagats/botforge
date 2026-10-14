"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi, getStoredToken } from "../lib/api";
import { LoginInput, User } from "../types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperadmin: boolean;
  login: (data: LoginInput) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await authApi.getMe();
      setUser(profile);
    } catch (err) {
      console.warn("Session expired or invalid, logging out:", err);
      authApi.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (data: LoginInput): Promise<User> => {
    await authApi.login(data);
    const profile = await authApi.getMe();
    setUser(profile);
    return profile;
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await authApi.getMe();
    setUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isSuperadmin: user?.role === "superadmin",
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
