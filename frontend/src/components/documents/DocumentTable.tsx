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
              <Skeleton key={i} height={48} className="rounded-xl" />
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
              <tr className="border-b border-slate-200/70 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Document Title</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Chunks</th>
                <th className="px-4 py-3.5">Date Ingested</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col min-w-0">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate max-w-sm sm:max-w-md"
                      >
                        {doc.title || "Untitled Document"}
                      </Link>
                      {doc.original_url && (
                        <a
                          href={doc.original_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-slate-400 hover:text-indigo-500 truncate max-w-xs mt-0.5"
                        >
                          {doc.original_url}
                        </a>
                      )}
                      {doc.error_message && (
                        <span className="text-[11px] text-rose-500 font-medium truncate mt-0.5">
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

                  <td className="px-4 py-4 text-center whitespace-nowrap font-mono font-medium text-slate-700">
                    {doc.chunk_count || 0}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-slate-500">
                    {formatDate(doc.created_at)}
                  </td>

                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="View details"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDocToDelete(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
