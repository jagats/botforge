"use client";

import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TenantProfileForm } from "@/components/settings/TenantProfileForm";
import { ApiKeyDisplay } from "@/components/settings/ApiKeyDisplay";
import { WidgetEmbedCode } from "@/components/settings/WidgetEmbedCode";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Settings & Embed"
        description="Manage your organization profile, inspect public API credentials, and integrate the chatbot snippet into your website."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings & Embed" },
        ]}
      />

      {/* Organization Profile Details */}
      <TenantProfileForm />

      {/* Public API Key Card */}
      <ApiKeyDisplay />

      {/* 1-Script Embed Card */}
      <WidgetEmbedCode showPreviewLink={true} />
    </div>
  );
}
