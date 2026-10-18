"use client";

import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WidgetEmbedCode } from "@/components/settings/WidgetEmbedCode";
import { WidgetPreview } from "@/components/settings/WidgetPreview";

export default function WidgetEmbedPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Widget Embed & Live Preview"
        description="Preview how your AI chatbot looks, feels, and interacts on a live website before deploying to production."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Widget Embed" },
        ]}
      />

      {/* Script Tag Snippet */}
      <WidgetEmbedCode showPreviewLink={false} />

      {/* Live Interactive Browser Preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-[#F5EDE8]">
          Live Interactive Simulator
        </h3>
        <p className="text-xs text-[#C4B4A8] mb-3">
          Click the chat launcher bubble in the bottom right corner of the preview to test conversations in real time.
        </p>
        <WidgetPreview />
      </div>
    </div>
  );
}
