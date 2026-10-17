"use client";

import React from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { useTenant } from "@/hooks/useTenant";

export interface WidgetEmbedCodeProps {
  showPreviewLink?: boolean;
}

export const WidgetEmbedCode: React.FC<WidgetEmbedCodeProps> = ({
  showPreviewLink = true,
}) => {
  const { apiKey } = useTenant();

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const embedSnippet = apiKey?.public_key
    ? `<script src="${backendUrl}/widget.js" data-public-key="${apiKey.public_key}" async></script>`
    : "";

  return (
    <GlassCard elevated padding="lg" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>🔌</span> Embed Chatbot on Your Website
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrate your grounded AI assistant into any HTML, WordPress, or Next.js site with a single script tag.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/widget-demo.html?key=${encodeURIComponent(apiKey?.public_key || "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="sm">
              Live Standalone Demo ↗
            </Button>
          </a>

          {showPreviewLink && (
            <Link href="/dashboard/widget-embed">
              <Button variant="primary" size="sm">
                Interactive Preview →
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            HTML Script Tag Snippet:
          </span>
          {embedSnippet && (
            <CopyButton text={embedSnippet} label="Copy Snippet" size="sm" />
          )}
        </div>

        <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all shadow-inner leading-relaxed">
          {embedSnippet || "Generating widget script snippet..."}
        </pre>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Paste this script tag directly into the <code>&lt;head&gt;</code> or <code>&lt;body&gt;</code> of your website. The widget loads asynchronously, isolates its styles using Shadow DOM, and automatically creates a floating chat drawer.
      </p>
    </GlassCard>
  );
};
