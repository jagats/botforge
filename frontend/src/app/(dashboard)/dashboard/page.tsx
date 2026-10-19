"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useDocuments } from "@/hooks/useDocuments";
import { useTenant } from "@/hooks/useTenant";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import { UploadModal } from "@/components/documents/UploadModal";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { PiPlusCircleLight, PiChatCircleDotsLight } from "react-icons/pi";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { documents, isLoading: isDocsLoading, refetch } = useDocuments();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Compute metrics
  const documentCount = documents.length;
  const readyCount = documents.filter((d) => d.status === "ready").length;
  const processingCount = documents.filter(
    (d) => d.status === "processing" || d.status === "pending"
  ).length;
  const totalChunks = documents.reduce(
    (sum, d) => sum + (d.chunk_count || 0),
    0
  );

  const brandName = tenant?.name || user?.company_name || "Partner Workspace";
  const tenantId = tenant?.id || user?.tenant_id || "";

  return (
    <div className="space-y-8">
      {/* Dark Glassmorphic Welcome Banner */}
      <GlassCard className="relative overflow-hidden p-6 sm:p-8 border border-[rgba(255,248,245,0.20)] bg-linear-to-br from-[rgba(221,208,200,0.15)] via-[rgba(221,208,200,0.08)] to-[rgba(50,50,50,0.25)]">
        {/* Subtle decorative glow orbs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(221,208,200,0.15),transparent_70%)] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(196,180,168,0.12),transparent_70%)] blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="purple" size="sm" dot>
                Multi-Tenant Vector Partition Active
              </Badge>
              {tenant?.plan && (
                <Badge variant="info" size="sm">
                  {tenant.plan.toUpperCase()} PLAN
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Welcome back, {brandName}
            </h1>

            <p className="text-xs sm:text-sm text-[#C4B4A8] max-w-2xl leading-relaxed">
              Your dedicated Qdrant vector memory is live and secured under isolated Tenant ID:{" "}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-bg-page border border-[rgba(221,208,200,0.20)] font-mono text-xs font-semibold text-[#DDD0C8] shadow-2xs">
                {tenantId || "..."}
                {tenantId && <CopyButton text={tenantId} size="sm" />}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="accent"
              size="md"
              onClick={() => setIsUploadModalOpen(true)}
              leftIcon={<PiPlusCircleLight size={18} />}
            >
              Ingest Knowledge
            </Button>
            <Link href="/dashboard/chat-playground">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<PiChatCircleDotsLight size={18} />}
              >
                Chat Playground
              </Button>
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* KPI Metrics Grid */}
      <StatsGrid
        documentCount={documentCount}
        readyCount={readyCount}
        processingCount={processingCount}
        totalChunks={totalChunks}
        isLoading={isDocsLoading}
      />

      {/* Quick Action Hub */}
      <QuickActions onUploadClick={() => setIsUploadModalOpen(true)} />

      {/* Recent Ingested Documents */}
      <RecentDocuments
        documents={documents}
        isLoading={isDocsLoading}
        onUploadClick={() => setIsUploadModalOpen(true)}
      />

      {/* Document Ingestion Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
