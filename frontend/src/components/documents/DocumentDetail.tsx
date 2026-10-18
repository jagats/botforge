"use client";

import React, { useState } from "react";
import { Document } from "@/types";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDateTime } from "@/lib/utils";

export interface DocumentDetailProps {
  document: Document;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

export const DocumentDetail: React.FC<DocumentDetailProps> = ({
  document,
  onDelete,
  isDeleting,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <div className="space-y-6">
      <GlassCard elevated padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(221,208,200,0.15)]">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h2 className="text-xl font-bold text-[#F5EDE8] tracking-tight">
                {document.title || "Untitled Document"}
              </h2>
              <DocumentStatusBadge status={document.status} />
            </div>
            <p className="text-xs text-[#7A6E68] font-mono">
              Document ID: {document.id}
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
            isLoading={isDeleting}
          >
            Purge Document & Vectors
          </Button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-md bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.18)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A6E68]">
              Source Type
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge variant="neutral" size="sm">
                {document.source_type.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="p-4 rounded-md bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.18)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A6E68]">
              Vector Chunks
            </span>
            <p className="mt-1 text-base font-bold font-mono text-[#DDD0C8]">
              {document.chunk_count || 0} chunks
            </p>
          </div>

          <div className="p-4 rounded-md bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.18)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A6E68]">
              Created At
            </span>
            <p className="mt-1 text-xs font-medium text-[#C4B4A8]">
              {formatDateTime(document.created_at)}
            </p>
          </div>

          <div className="p-4 rounded-md bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.18)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A6E68]">
              Last Updated
            </span>
            <p className="mt-1 text-xs font-medium text-[#C4B4A8]">
              {formatDateTime(document.updated_at)}
            </p>
          </div>
        </div>

        {document.original_url && (
          <div className="mt-6 p-4 rounded-md bg-[rgba(221,208,200,0.10)] border border-[rgba(221,208,200,0.22)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#DDD0C8]">
              Original Web Resource
            </span>
            <p className="mt-1 text-xs font-mono text-[#F5EDE8] break-all">
              <a
                href={document.original_url}
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-1 text-[#DDD0C8]"
              >
                <span>{document.original_url}</span>
                <span>↗</span>
              </a>
            </p>
          </div>
        )}

        {document.error_message && (
          <div className="mt-6 p-4 rounded-md bg-rose-500/15 border border-rose-500/30">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-300">
              Ingestion Failure Reason
            </span>
            <p className="mt-1 text-xs text-rose-200 font-mono">
              {document.error_message}
            </p>
          </div>
        )}
      </GlassCard>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onDelete}
        title="Purge Document"
        message="Are you sure you want to permanently purge this document and all its indexed vector chunks from Qdrant?"
        confirmText="Confirm Purge"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
