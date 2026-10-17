"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { useTenant } from "@/hooks/useTenant";

export const ApiKeyDisplay: React.FC = () => {
  const { apiKey, isLoadingApiKey } = useTenant();

  return (
    <GlassCard elevated padding="lg" className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>🔑</span> Public API Key
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Client-safe identifier used by the embeddable chat widget to authenticate visitors.
          </p>
        </div>

        {apiKey?.is_active && (
          <Badge variant="success" size="sm" dot>
            Active & Verified
          </Badge>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">
            API Key:
          </span>
          <code className="font-mono text-xs sm:text-sm font-bold text-indigo-700 truncate selection:bg-indigo-200">
            {isLoadingApiKey ? "Loading key..." : apiKey?.public_key || "No key issued"}
          </code>
        </div>

        {apiKey?.public_key && (
          <div className="shrink-0">
            <CopyButton text={apiKey.public_key} label="Copy Key" size="sm" />
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        🔒 This key is public and designed for embedding in client-facing website scripts. It grants read-only conversational access strictly constrained to your tenant&apos;s indexed knowledge base.
      </p>
    </GlassCard>
  );
};
