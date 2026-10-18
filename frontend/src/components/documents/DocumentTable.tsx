"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Document } from "@/types";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import { PiEyeLight, PiTrashLight } from "react-icons/pi";

export interface DocumentTableProps {
  documents: Document[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
  onOpenUpload: () => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  isLoading,
  onDelete,
  isDeleting,
  onOpenUpload,
}) => {
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  const getSourceTypeBadge = (sourceType: Document["source_type"]) => {
    switch (sourceType) {
      case "pdf":
        return <Badge variant="neutral" size="sm">PDF</Badge>;
      case "url":
        return <Badge variant="info" size="sm">URL</Badge>;
      case "faq_text":
        return <Badge variant="purple" size="sm">FAQ</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{sourceType}</Badge>;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    try {
      await onDelete(docToDelete.id);
      setDocToDelete(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  if (isLoading) {
    return (
      <GlassCard padding="none" className="overflow-hidden">
        <div className="p-6 space-y-4">
          <Skeleton height={24} width="30%" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={48} className="rounded-md" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents ingested yet"
        description="Upload your product PDFs, webpage links, or custom FAQs to begin training your chatbot."
        action={{
          label: "Upload Document",
          onClick: onOpenUpload,
        }}
      />
    );
  }

  return (
    <>
      <GlassCard padding="none" className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[rgba(221,208,200,0.15)] bg-[rgba(221,208,200,0.06)] text-[#C4B4A8] font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Document Title</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Chunks</th>
                <th className="px-4 py-3.5">Date Ingested</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(221,208,200,0.10)]">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-[rgba(221,208,200,0.06)] transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col min-w-0">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="font-bold text-[#F5EDE8] hover:text-[#DDD0C8] transition-colors truncate max-w-sm sm:max-w-md"
                      >
                        {doc.title || "Untitled Document"}
                      </Link>
                      {doc.original_url && (
                        <a
                          href={doc.original_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#7A6E68] hover:text-[#DDD0C8] truncate max-w-xs mt-0.5"
                        >
                          {doc.original_url}
                        </a>
                      )}
                      {doc.error_message && (
                        <span className="text-[11px] text-rose-400 font-medium truncate mt-0.5">
                          Error: {doc.error_message}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    {getSourceTypeBadge(doc.source_type)}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <DocumentStatusBadge status={doc.status} />
                  </td>

                  <td className="px-4 py-4 text-center whitespace-nowrap font-mono font-medium text-[#DDD0C8]">
                    {doc.chunk_count || 0}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-[#7A6E68]">
                    {formatDate(doc.created_at)}
                  </td>

                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="p-1.5 rounded-md text-[#C4B4A8] hover:text-[#F5EDE8] hover:bg-[rgba(221,208,200,0.12)] transition-colors"
                        title="View details"
                      >
                        <PiEyeLight size={18} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDocToDelete(doc)}
                        className="p-1.5 rounded-md text-[#C4B4A8] hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <PiTrashLight size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${docToDelete?.title || "this document"}" and purge all its vector embeddings from Qdrant? This cannot be undone.`}
        confirmText="Delete Document"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};
