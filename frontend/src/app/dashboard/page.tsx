"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { documentApi } from "../../lib/api";

export default function DashboardOverviewPage() {
  const { user } = useAuth();

  const { data: docData } = useQuery({
    queryKey: ["documents"],
    queryFn: documentApi.list,
  });

  const documents = docData?.documents || [];
  const readyDocs = documents.filter((d) => d.status === "ready");
  const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-slate-900 p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Phase 2 Complete: Ingestion & Qdrant Vectors
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Welcome, {user?.company_name || "Partner"}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Your dedicated multi-tenant workspace is live. Documents are segmented, vectorized, and stored
              in Qdrant strictly isolated under Tenant ID{" "}
              <code className="px-1.5 py-0.5 rounded bg-slate-950 text-blue-400 font-mono text-xs border border-slate-800">
                {user?.tenant_id}
              </code>
              .
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard/documents"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              <span>📄</span>
              <span>Manage Documents</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors"
            >
              <span>⚙️</span>
              <span>Settings & Snippet</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 transition-all hover:border-slate-700 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Knowledge Documents
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {documents.length}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {readyDocs.length} ready in Qdrant ({totalChunks} vector chunks).
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 transition-all hover:border-slate-700 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Total Conversations
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">0</div>
          <p className="text-xs text-slate-400 mt-2">
            Tracks visitor sessions in Phase 3.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 transition-all hover:border-slate-700 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Active Subscription
          </div>
          <div className="text-2xl font-bold text-white tracking-tight capitalize">
            Trial Plan
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Full access to document ingestion and vector retrieval.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 transition-all hover:border-slate-700 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Tenant Isolation
          </div>
          <div className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Active & Scoped</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Postgres and Qdrant queries filtered by tenant.
          </p>
        </div>
      </div>

      {/* Next Phase Guide */}
      <div className="bg-slate-900/60 border-l-4 border-l-blue-500 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <span>🎯</span>
          <span>Next Up: Phase 3 (RAG Chat API & Test Playground)</span>
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-3xl mb-4">
          With document ingestion and multi-tenant Qdrant indexing complete, Phase 3 will introduce
          the grounded RAG chat engine (Qdrant semantic retrieval + GPT-4o answers) and the in-dashboard
          test chat playground to chat with your bot.
        </p>
        <div>
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4"
          >
            <span>Open Document Manager</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
