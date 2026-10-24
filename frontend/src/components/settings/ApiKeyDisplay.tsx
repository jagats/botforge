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
      <div className="flex items-center justify-between pb-4 border-b border-[rgba(221,208,200,0.15)]">
        <div>
          <h2 className="text-base font-bold text-[#F5EDE8] tracking-tight flex items-center gap-2">
            <PiKeyLight size={18} className="text-[#DDD0C8]" />
            <span>Public API Key</span>
          </h2>
          <p className="text-xs text-[#C4B4A8] mt-0.5">
            Client-safe identifier used by the embeddable chat widget to authenticate visitors.
          </p>
        </div>

        {apiKey?.is_active && (
          <Badge variant="success" size="sm" dot>
            Active & Verified
          </Badge>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-md bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.20)]">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A6E68] shrink-0">
            API Key:
          </span>
          <code className="font-mono text-xs sm:text-sm font-bold text-[#DDD0C8] truncate">
            {isLoadingApiKey ? "Loading key..." : apiKey?.public_key || "No key issued"}
          </code>
        </div>

        {apiKey?.public_key && (
          <div className="shrink-0">
            <CopyButton text={apiKey.public_key} label="Copy Key" size="sm" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-[#7A6E68] leading-relaxed">
        <PiShieldCheckLight size={15} className="text-[#DDD0C8] shrink-0" />
        <span>This key is public and designed for embedding in client-facing website scripts. It grants read-only conversational access strictly constrained to your tenant&apos;s indexed knowledge base.</span>
      </div>
    </GlassCard>
  );
};
