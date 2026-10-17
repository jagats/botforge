"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTenant } from "@/hooks/useTenant";
import { Spinner } from "@/components/ui/Spinner";

export const WidgetPreview: React.FC = () => {
  const { apiKey } = useTenant();
  const [iframeKey, setIframeKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const demoUrl = apiKey?.public_key
    ? `/widget-demo.html?key=${encodeURIComponent(apiKey.public_key)}`
    : "";

  return (
    <GlassCard elevated padding="none" className="overflow-hidden shadow-lg border border-slate-200/90">
      {/* Mock Browser Header / Chrome */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100/90 border-b border-slate-200/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400/80 inline-block" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80 inline-block" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/80 inline-block" />
        </div>

        {/* Mock Address Bar */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-500 w-full max-w-sm sm:max-w-md shadow-2xs">
          <svg className="h-3.5 w-3.5 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          <span className="truncate">https://yourclientwebsite.com/support</span>
        </div>

        {/* Reload button */}
        <button
          type="button"
          onClick={() => {
            setIsIframeLoading(true);
            setIframeKey((prev) => prev + 1);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          title="Reload preview"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Simulated Website Viewport */}
      <div className="relative w-full h-[540px] bg-white">
        {isIframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-xs z-10">
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" />
              <span className="text-xs font-semibold text-slate-500">Loading live widget preview...</span>
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
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">
            No public API key available for preview
          </div>
        )}
      </div>
    </GlassCard>
  );
};
