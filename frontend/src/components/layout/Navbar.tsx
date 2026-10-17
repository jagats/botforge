"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui";

export const Navbar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <nav className="w-full glass-topbar sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs shadow-indigo-500/30">
            <span className="text-base font-black">B</span>
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-lg">
            BotForge
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline">
                Signed in as <strong className="text-slate-800">{user?.email}</strong>
              </span>
              <Link href={user?.role === "superadmin" ? "/admin/brands" : "/dashboard"}>
                <Button variant="primary" size="sm">
                  {user?.role === "superadmin" ? "Admin Portal →" : "Dashboard →"}
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="primary" size="sm">
                Sign In →
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
