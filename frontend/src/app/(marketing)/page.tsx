"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Dynamic ambient background orbs */}
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-16 sm:pt-24 pb-20 max-w-5xl mx-auto">
        <Badge variant="purple" size="md" dot className="mb-6 shadow-xs px-3.5 py-1">
          ✦ Powered by LangChain, FastAPI & Qdrant Vector Search
        </Badge>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.1] mb-6">
          Build & Deploy <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Grounded AI Chatbots</span> in Minutes
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed mb-8">
          Upload manuals, scrape knowledge base URLs, or add FAQs. BotForge segments, vectorizes, and serves strictly-grounded AI assistants with 1-line website widget embedding.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          {isAuthenticated ? (
            <Link
              href={user?.role === "superadmin" ? "/admin/brands" : "/dashboard"}
              className="w-full sm:w-auto"
            >
              <Button variant="purple" size="lg" fullWidth className="shadow-lg shadow-indigo-500/20">
                {user?.role === "superadmin"
                  ? "Open Superadmin Console →"
                  : "Go to Dashboard Workspace →"}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="purple" size="lg" fullWidth className="shadow-lg shadow-indigo-500/20">
                  Launch Console →
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" fullWidth>
                  Explore Demo
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Interactive Visual Mockup Preview */}
        <div className="mt-14 w-full max-w-3xl">
          <GlassCard className="p-4 sm:p-6 shadow-2xl border-slate-200/80 bg-white/80 backdrop-blur-xl text-left space-y-4">
            {/* Mock Chat Window Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  BF
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">BotForge Support Agent</p>
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online & Grounded in Tenant Knowledge Base
                  </p>
                </div>
              </div>
              <Badge variant="neutral" size="sm">
                Qdrant Isolated Partition
              </Badge>
            </div>

            {/* Mock Chat Stream Exchange */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-md shadow-xs">
                  What is your cancellation policy and how does refund processing work?
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-slate-100/90 text-slate-800 rounded-2xl rounded-tl-xs px-4 py-2.5 max-w-md space-y-2 border border-slate-200/60 shadow-2xs">
                  <p className="leading-relaxed">
                    According to the Service Agreement, subscriptions can be cancelled at any time from your billing portal. Refunds are automatically calculated on a pro-rata basis and credited within 3-5 business days.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/50">
                    <span className="text-[10px] text-slate-500 font-medium">Verified Sources:</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-indigo-700 border border-slate-200">
                      📄 Terms_Of_Service.pdf (Chunk #4)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-indigo-700 border border-slate-200">
                      💬 Billing_FAQ (Chunk #1)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-20 w-full text-left">
          <GlassCard padding="md" className="hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold mb-3 shadow-2xs">
              🔒
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              Strict Multi-Tenancy
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every client organization receives an isolated database partition and scoped Qdrant payload filters.
            </p>
          </GlassCard>

          <GlassCard padding="md" className="hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold mb-3 shadow-2xs">
              ⚡
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              Sub-Second RAG
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cosine vector similarity retrieval delivers high-relevance context chunks to the LLM in milliseconds.
            </p>
          </GlassCard>

          <GlassCard padding="md" className="hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold mb-3 shadow-2xs">
              🎯
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              Zero-Hallucination
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              System instructions strictly enforce answering only from verified documents with transparent citations.
            </p>
          </GlassCard>

          <GlassCard padding="md" className="hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold mb-3 shadow-2xs">
              🔌
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              1-Line Embed Widget
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lightweight floating chat bubble script that integrates seamlessly on any WordPress, React, or static site.
            </p>
          </GlassCard>
        </div>

        {/* Architecture Steps */}
        <div className="mt-24 w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              From Ingestion to Live Widget in 3 Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              BotForge handles the heavy lifting of text chunking, embedding generation, vector indexing, and real-time streaming.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <GlassCard className="p-6 space-y-2 border-indigo-100">
              <span className="h-8 w-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                1
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Ingest Knowledge</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload company PDFs, scrape URLs, or write FAQ pairs. Text is automatically segmented into optimal chunk windows.
              </p>
            </GlassCard>

            <GlassCard className="p-6 space-y-2 border-purple-100">
              <span className="h-8 w-8 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                2
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Tune & Test Playground</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ask questions in the interactive playground. Inspect retrieved source chunks and verify answer accuracy.
              </p>
            </GlassCard>

            <GlassCard className="p-6 space-y-2 border-emerald-100">
              <span className="h-8 w-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                3
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Copy Embed Script</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Paste one single &lt;script&gt; snippet into your website HTML to launch your customized AI customer support agent.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>
    </div>
  );
}
