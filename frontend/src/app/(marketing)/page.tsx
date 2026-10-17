"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button, GlassCard, Badge } from "@/components/ui";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-20 pb-24 max-w-5xl mx-auto">
        <Badge variant="success" size="md" dot className="mb-6 shadow-xs">
          Enterprise Multi-Tenant AI Bot Platform
        </Badge>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.1] mb-6">
          Grounded AI Chatbots for Your Business
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-2xl leading-relaxed mb-10">
          Upload documents, scrape website FAQs, and embed an isolated,
          strictly-grounded AI chatbot on your website in minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {isAuthenticated ? (
            <Link
              href={user?.role === "superadmin" ? "/admin/brands" : "/dashboard"}
              className="w-full sm:w-auto"
            >
              <Button variant="primary" size="lg" fullWidth>
                {user?.role === "superadmin"
                  ? "Admin Console →"
                  : "Go to Workspace Dashboard →"}
              </Button>
            </Link>
          ) : (
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" fullWidth className="shadow-lg shadow-indigo-500/25">
                Sign In to Workspace →
              </Button>
            </Link>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-20 w-full text-left">
          <GlassCard padding="md" className="hover:-translate-y-1 transition-all duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold mb-3 shadow-2xs">
              🐘
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1.5">
              PostgreSQL Isolated DB
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Strict multi-tenant partitioning with dedicated tenant IDs, user credentials, and public API keys.
            </p>
          </GlassCard>

          <GlassCard padding="md" className="hover:-translate-y-1 transition-all duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold mb-3 shadow-2xs">
              ⚡
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1.5">
              Qdrant Vector DB
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Shared collection with indexed tenant filtering for sub-millisecond semantic chunk retrieval.
            </p>
          </GlassCard>

          <GlassCard padding="md" className="hover:-translate-y-1 transition-all duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold mb-3 shadow-2xs">
              🔒
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1.5">
              FastAPI Security
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              JWT authentication, bcrypt password hashing, and dependency-injected tenant verification.
            </p>
          </GlassCard>

          <GlassCard padding="md" className="hover:-translate-y-1 transition-all duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold mb-3 shadow-2xs">
              🔌
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1.5">
              1-Script Widget
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lightweight vanilla TypeScript embed snippet that connects visitors directly to your grounded bot.
            </p>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
