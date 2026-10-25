"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { useTenant } from "@/hooks/useTenant";
import { PiKeyLight, PiShieldCheckLight } from "react-icons/pi";

export const ApiKeyDisplay: React.FC = () => {
  const { apiKey, isLoadingApiKey } = useTenant({ includeApiKey: true });

  return (
    <GlassCard elevated padding="lg" className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-[#e0ece4]">
        <div>
          <h2 className="text-base font-bold text-[#1b4332] tracking-tight flex items-center gap-2">
            <PiKeyLight size={18} className="text-[#40916c]" />
            <span>Public API Key</span>
          </h2>
          <p className="text-xs text-[#52796f] mt-0.5">
            Client-safe identifier used by the embeddable chat widget to authenticate visitors.
          </p>
        </div>

        {apiKey?.is_active && (
          <Badge variant="success" size="sm" dot>
            Active & Verified
          </Badge>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#f8fbf9] border border-[#d8f3dc]">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#52796f] shrink-0">
            API Key:
          </span>
          <code className="font-mono text-xs sm:text-sm font-bold text-[#1b4332] truncate">
            {isLoadingApiKey ? "Loading key..." : apiKey?.public_key || "No key issued"}
          </code>
        </div>

        {apiKey?.public_key && (
          <div className="shrink-0">
            <CopyButton text={apiKey.public_key} label="Copy Key" size="sm" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-[#6b8f7e] leading-relaxed">
        <PiShieldCheckLight size={15} className="text-[#40916c] shrink-0" />
        <span>This key is public and designed for embedding in client-facing website scripts. It grants read-only conversational access strictly constrained to your tenant&apos;s indexed knowledge base.</span>
      </div>
    </GlassCard>
  );
};
