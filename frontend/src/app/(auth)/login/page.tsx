"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/layout/Logo";
import { Badge } from "@/components/ui/Badge";
import {
  PiSparkleLight,
  PiShieldCheckLight,
  PiLightningLight,
  PiCheckCircleLight,
  PiBookOpenLight,
} from "react-icons/pi";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "superadmin") {
        router.push("/admin/brands");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding & Product Preview (Desktop) */}
      <div className="hidden lg:flex lg:w-3/5 xl:w-7/12 flex-col justify-between p-12 lg:p-16 border-r border-[rgba(221,208,200,0.15)] bg-gradient-to-br from-[#1E1A17] via-[#28221E] to-[#1E1A17] relative overflow-hidden">
        {/* Subtle decorative glow orbs within left panel */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[radial-gradient(circle,rgba(221,208,200,0.15),transparent_70%)] pointer-events-none rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[radial-gradient(circle,rgba(196,180,168,0.12),transparent_70%)] pointer-events-none rounded-full blur-3xl" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Logo size="md" />
          <Badge variant="purple" size="sm" dot>
            Enterprise v2.0
          </Badge>
        </div>

        {/* Hero Narrative */}
        <div className="relative z-10 my-auto py-8 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[rgba(221,208,200,0.12)] border border-[rgba(221,208,200,0.25)] text-xs text-[#DDD0C8] font-medium">
            <PiSparkleLight size={15} />
            <span>Multi-Tenant AI Bot-as-a-Service Platform</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-[#F5EDE8] leading-[1.15]">
            Grounded AI Intelligence,{" "}
            <span className="text-[#DDD0C8]">Tailored for Your Brand.</span>
          </h1>

          <p className="text-sm xl:text-base text-[#C4B4A8] leading-relaxed">
            Ingest PDFs, websites, and FAQs into domain-specific vector storage.
            Deploy real-time chatbots with precise source citations in under 5 minutes.
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              "Qdrant Vector Retrieval",
              "LangChain RAG Pipeline",
              "Strict Tenant Isolation",
              "1-Line Embed Widget",
            ].map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] text-xs bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.18)] text-[#DDD0C8]"
              >
                <PiCheckCircleLight size={14} className="text-[#4ADE80]" />
                {feature}
              </span>
            ))}
          </div>

          {/* Frosted Chat Mockup */}
          <div className="pt-4">
            <div className="rounded-md glass-card p-5 border border-[rgba(255,248,245,0.20)] shadow-2xl space-y-3.5 max-w-lg">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(221,208,200,0.12)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#4ADE80] animate-pulse" />
                  <span className="text-xs font-semibold text-[#F5EDE8]">
                    BotForge Agent Preview
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#7A6E68]">
                  rag-session#9241
                </span>
              </div>

              {/* User message */}
              <div className="flex justify-end">
                <div className="rounded-md bg-[#323232] border border-[rgba(221,208,200,0.20)] px-3.5 py-2 text-xs text-[#F5EDE8] max-w-xs shadow-xs">
                  How do I configure the embedded widget for our help desk?
                </div>
              </div>

              {/* Bot response */}
              <div className="flex flex-col items-start gap-1.5">
                <div className="rounded-md bg-[rgba(221,208,200,0.15)] border border-[rgba(255,248,245,0.25)] px-3.5 py-2.5 text-xs text-[#F5EDE8] max-w-md shadow-xs leading-relaxed">
                  Navigate to <strong>Widget Embed</strong>, customize your brand accent color, and paste the single script tag before your closing &lt;/body&gt; tag.
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[rgba(221,208,200,0.10)] text-[10px] text-[#DDD0C8] border border-[rgba(221,208,200,0.15)]">
                  <PiBookOpenLight size={12} />
                  <span>Source: docs/widget-integration-guide.pdf</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Platform Proof */}
        <div className="relative z-10 pt-6 border-t border-[rgba(221,208,200,0.12)] grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-[#F5EDE8]">99.9%</p>
            <p className="text-[11px] text-[#7A6E68]">Uptime SLA</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[#F5EDE8]">&lt;450ms</p>
            <p className="text-[11px] text-[#7A6E68]">Avg RAG Latency</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[#F5EDE8]">100%</p>
            <p className="text-[11px] text-[#7A6E68]">Data Isolation</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-2/5 xl:w-5/12 flex items-center justify-center p-6 sm:p-12 lg:p-16 my-auto">
        <LoginForm />
      </div>
    </div>
  );
}
