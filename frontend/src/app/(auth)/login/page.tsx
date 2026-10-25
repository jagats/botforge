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
  PiCheckCircleLight,
  PiLightningLight,
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
    <div className="w-full max-w-5xl clay-card-elevated bg-[#ffffff] rounded-3xl overflow-hidden shadow-2xl border border-[#d8f3dc] grid grid-cols-1 lg:grid-cols-12 my-auto">
      {/* Left Panel - Stylized Reference Layout with 3D Organic Spheres (Desktop) */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col justify-between p-8 xl:p-10 bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-[#ffffff] relative overflow-hidden select-none">
        {/* Claymorphic 3D spheres / orbs following the reference design */}
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-gradient-to-br from-[#52b788]/40 to-transparent blur-sm pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-64 h-64 rounded-full bg-gradient-to-tr from-[#132a13] to-[#2d6a4f] shadow-2xl pointer-events-none opacity-90 border border-[#52b788]/20" />
        <div className="absolute bottom-12 right-2 w-36 h-36 rounded-full bg-gradient-to-br from-[#52b788] via-[#40916c] to-[#1b4332] shadow-2xl pointer-events-none border border-[#74c69d]/40" />
        <div className="absolute top-1/3 -right-10 w-24 h-24 rounded-full bg-gradient-to-br from-[#74c69d] to-[#2d6a4f] opacity-80 blur-[2px] pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-[#ffffff]/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-xs">
              <span className="text-[#ffffff] font-extrabold text-sm">BF</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#ffffff]">
              BotForge
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-[#ffffff]/15 border border-[#ffffff]/20 text-[11px] font-semibold text-[#ffffff] backdrop-blur-md">
            Enterprise v2.0
          </span>
        </div>

        {/* Hero Narrative - Strictly fit within one fold */}
        <div className="relative z-10 my-auto py-6 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#ffffff]/15 border border-[#ffffff]/20 text-xs text-[#d8f3dc] font-medium backdrop-blur-sm">
            <PiSparkleLight size={14} className="text-[#95d5b2]" />
            <span>AI Bot-as-a-Service Platform</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-extrabold tracking-widest uppercase text-[#95d5b2]">
              WELCOME
            </p>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-[#ffffff] leading-tight">
              Grounded AI for Your Brand
            </h1>
          </div>

          <p className="text-xs xl:text-sm text-[#d8f3dc]/90 leading-relaxed max-w-sm">
            Ingest PDFs, websites, and FAQs into domain-specific vector storage.
            Deploy real-time chatbots with strict source citations in under 5 minutes.
          </p>

          {/* Feature Badges */}
          <div className="flex flex-col gap-2 pt-2">
            {[
              "Qdrant Vector Retrieval",
              "LangChain RAG Pipeline",
              "Strict Tenant Data Isolation",
              "1-Line Embed Widget",
            ].map((feature) => (
              <div
                key={feature}
                className="inline-flex items-center gap-2 text-xs text-[#ffffff] font-medium"
              >
                <span className="p-0.5 rounded-full bg-[#52b788] text-[#1b4332]">
                  <PiCheckCircleLight size={13} className="text-[#132a13]" />
                </span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Platform Proof - Compact strip */}
        <div className="relative z-10 pt-4 border-t border-[#ffffff]/20 grid grid-cols-3 gap-2 text-center text-[#ffffff]">
          <div>
            <p className="text-base font-bold text-[#ffffff]">99.9%</p>
            <p className="text-[10px] text-[#d8f3dc]">Uptime SLA</p>
          </div>
          <div>
            <p className="text-base font-bold text-[#ffffff]">&lt;450ms</p>
            <p className="text-[10px] text-[#d8f3dc]">Avg RAG</p>
          </div>
          <div>
            <p className="text-base font-bold text-[#ffffff]">100%</p>
            <p className="text-[10px] text-[#d8f3dc]">Isolated</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="lg:col-span-7 xl:col-span-7 p-6 sm:p-10 lg:p-12 flex items-center justify-center bg-[#ffffff]">
        <LoginForm />
      </div>
    </div>
  );
}
