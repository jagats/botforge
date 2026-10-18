"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTenant } from "@/hooks/useTenant";
import { Spinner } from "@/components/ui/Spinner";
import { PiLockLight, PiArrowsClockwiseLight } from "react-icons/pi";

export const WidgetPreview: React.FC = () => {
  const { apiKey } = useTenant();
  const [iframeKey, setIframeKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const demoUrl = apiKey?.public_key
    ? `/widget-demo.html?key=${encodeURIComponent(apiKey.public_key)}`
    : "";

  return (
    <GlassCard elevated padding="none" className="overflow-hidden shadow-lg border border-[rgba(255,248,245,0.22)]">
      {/* Mock Browser Header / Chrome */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#232020] border-b border-[rgba(221,208,200,0.15)] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400/80 inline-block" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80 inline-block" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/80 inline-block" />
        </div>

        {/* Mock Address Bar */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1A17] border border-[rgba(221,208,200,0.20)] text-xs font-mono text-[#DDD0C8] w-full max-w-sm sm:max-w-md shadow-2xs">
          <PiLockLight size={14} className="text-[#4ADE80] shrink-0" />
          <span className="truncate">https://yourclientwebsite.com/support</span>
        </div>

        {/* Reload button */}
        <button
          type="button"
          onClick={() => {
            setIsIframeLoading(true);
            setIframeKey((prev) => prev + 1);
          }}
          className="p-1.5 rounded-md text-[#C4B4A8] hover:text-[#F5EDE8] hover:bg-[rgba(221,208,200,0.10)] transition-colors cursor-pointer"
          title="Reload preview"
        >
          <PiArrowsClockwiseLight size={16} />
        </button>
      </div>

      {/* Simulated Website Viewport */}
      <div className="relative w-full h-[540px] bg-[#1E1A17]">
        {isIframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1E1A17]/80 backdrop-blur-xs z-10">
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" />
              <span className="text-xs font-semibold text-[#DDD0C8]">Loading live widget preview...</span>
            </div>
          </div>
        )}

        {demoUrl ? (
          <iframe
            key={iframeKey}
            src={demoUrl}
            title="Interactive Widget Preview"
            className="w-full h-full border-0"
            onLoad={() => setIsIframeLoading(false)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[#7A6E68] text-xs">
            No public API key available for preview
          </div>
        )}
      </div>
    </GlassCard>
  );
};
