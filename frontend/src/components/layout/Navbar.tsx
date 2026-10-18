"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui";
import { Logo } from "@/components/layout/Logo";

export const Navbar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <nav className="w-full glass-topbar sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo size="md" />

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#C4B4A8] hidden sm:inline">
                Signed in as <strong className="text-[#F5EDE8]">{user?.email}</strong>
              </span>
              <Link href={user?.role === "superadmin" ? "/admin/brands" : "/dashboard"}>
                <Button variant="accent" size="sm">
                  {user?.role === "superadmin" ? "Admin Portal →" : "Dashboard →"}
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="accent" size="sm">
                Sign In →
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
