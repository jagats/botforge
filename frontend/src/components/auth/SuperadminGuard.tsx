"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

export interface SuperadminGuardProps {
  children: React.ReactNode;
}

export const SuperadminGuard: React.FC<SuperadminGuardProps> = ({ children }) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== "superadmin") {
        router.push("/login");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" className="!text-purple-600" />
          <p className="text-xs font-semibold text-slate-500">
            Verifying administrator privileges...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
