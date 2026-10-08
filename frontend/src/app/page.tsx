"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      {/* Top Navbar */}
      <nav className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-base">
              🤖
            </span>
            <span>BotForge</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-400 hidden sm:inline">
                  Signed in as <strong className="text-slate-200">{user?.company_name}</strong>
                </span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all active:scale-95"
                >
                  Dashboard &rarr;
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition-all active:scale-95"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-16 pb-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Phase 2 Live: Multi-Tenant Ingestion & Qdrant Ready</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent max-w-4xl leading-[1.1] mb-6">
          Grounded AI Chatbots for Your Business
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
          Multi-tenant AI Bot-as-a-Service platform. Ingest domain documents, PDFs, and website FAQs,
          then embed an isolated chatbot strictly grounded in your company&apos;s data.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Go to Workspace Dashboard &rarr;
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Create Your Workspace &rarr;
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all flex items-center justify-center"
              >
                If you already have an account Sign In to your Existing Account
              </Link>
            </>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-20 w-full text-left">
          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 transition-all shadow-sm">
            <div className="text-2xl mb-3">🐘</div>
            <h2 className="text-base font-bold text-white mb-2">PostgreSQL Isolated DB</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Strict multi-tenant partitioning with dedicated tenant IDs, user credentials, and public API keys.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 transition-all shadow-sm">
            <div className="text-2xl mb-3">⚡</div>
            <h2 className="text-base font-bold text-white mb-2">Qdrant Vector DB</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Shared collection with indexed tenant filtering for sub-millisecond semantic chunk retrieval.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 transition-all shadow-sm">
            <div className="text-2xl mb-3">🔒</div>
            <h2 className="text-base font-bold text-white mb-2">FastAPI Security</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              JWT authentication, bcrypt password hashing, and dependency-injected tenant verification.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 transition-all shadow-sm">
            <div className="text-2xl mb-3">🔌</div>
            <h2 className="text-base font-bold text-white mb-2">1-Script Widget</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Lightweight vanilla TypeScript embed snippet that connects visitors directly to your grounded bot.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-600">
        BotForge &bull; AI Bot-as-a-Service Platform &bull; Built with FastAPI, Qdrant & Next.js
      </footer>
    </main>
  );
}
