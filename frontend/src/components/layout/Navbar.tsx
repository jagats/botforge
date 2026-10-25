"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui";
import { Logo } from "@/components/layout/Logo";

export const Navbar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <nav className="w-full bg-[#ffffff] border-b border-[#e0ece4] shadow-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo size="md" />

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#52796f] hidden sm:inline">
                Signed in as <strong className="text-[#1b4332]">{user?.email}</strong>
              </span>
              <Link href={user?.role === "superadmin" ? "/admin/brands" : "/dashboard"}>
                <Button variant="accent" size="sm">
                  {user?.role === "superadmin" ? "Admin Portal" : "Dashboard"}
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="accent" size="md">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
