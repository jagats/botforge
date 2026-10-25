"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTenant } from "@/hooks/useTenant";
import { Spinner } from "@/components/ui/Spinner";
import { PiLockLight, PiArrowsClockwiseLight } from "react-icons/pi";

export const WidgetPreview: React.FC = () => {
  const { apiKey } = useTenant({ includeApiKey: true });
  const [iframeKey, setIframeKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const demoUrl = apiKey?.public_key
    ? `/widget-demo.html?key=${encodeURIComponent(apiKey.public_key)}`
    : "";

  return (
    <GlassCard elevated padding="none" className="overflow-hidden shadow-lg border border-[#d8f3dc]">
      {/* Mock Browser Header / Chrome */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#ffffff] border-b border-[#e0ece4]">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400 inline-block" />
          <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
          <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
        </div>

        {/* Mock Address Bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f8fbf9] border border-[#d8f3dc] text-xs font-mono text-[#1b4332] w-full max-w-sm sm:max-w-md shadow-2xs">
          <PiLockLight size={14} className="text-[#40916c] shrink-0" />
          <span className="truncate">https://yourclientwebsite.com/support</span>
        </div>

        {/* Reload button */}
        <button
          type="button"
          onClick={() => {
            setIsIframeLoading(true);
            setIframeKey((prev) => prev + 1);
          }}
          className="p-1.5 rounded-lg text-[#52796f] hover:text-[#1b4332] hover:bg-[#f1faee] transition-colors cursor-pointer"
          title="Reload preview"
        >
          <PiArrowsClockwiseLight size={16} />
        </button>
      </div>

      {/* Simulated Website Viewport */}
      <div className="relative w-full h-[540px] bg-[#f1faee]">
        {isIframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#ffffff]/80 backdrop-blur-xs z-10">
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" />
              <span className="text-xs font-semibold text-[#1b4332]">Loading live widget preview...</span>
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
          <div className="flex items-center justify-center h-full text-[#6b8f7e] text-xs font-medium">
            No public API key available for preview
          </div>
        )}
      </div>
    </GlassCard>
  );
};
