"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Document } from "@/types";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import { PiEyeLight, PiTrashLight, PiMagnifyingGlassLight } from "react-icons/pi";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (doc.title && doc.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.original_url && doc.original_url.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === "all" || doc.source_type === typeFilter;
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchQuery, typeFilter, statusFilter]);

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
    <div className="space-y-4">
      {/* Controls Bar: Search & Custom Dropdown Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input
            id="doc-search"
            type="text"
            placeholder="Search by title or URL..."
            leftIcon={<PiMagnifyingGlassLight size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="w-full sm:w-44">
            <Select
              id="doc-type-filter"
              size="md"
              value={typeFilter}
              onValueChange={(val: string | number) => setTypeFilter(String(val))}
              options={[
                { label: "All Document Types", value: "all" },
                { label: "PDF Documents", value: "pdf" },
                { label: "Web URLs", value: "url" },
                { label: "Custom FAQs", value: "faq_text" },
              ]}
            />
          </div>

          <div className="w-full sm:w-40">
            <Select
              id="doc-status-filter"
              size="md"
              value={statusFilter}
              onValueChange={(val: string | number) => setStatusFilter(String(val))}
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Ready / Indexed", value: "ready" },
                { label: "Processing", value: "processing" },
                { label: "Failed", value: "failed" },
              ]}
            />
          </div>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="rounded-2xl clay-card p-8 bg-[#ffffff]">
          <EmptyState
            title="No matching documents"
            description="Try clearing your search query or adjusting your type/status filters."
          />
        </div>
      ) : (
        <GlassCard padding="none" className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#e0ece4] bg-[#f8fbf9] text-[#52796f] font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Document Title</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Chunks</th>
                  <th className="px-4 py-3.5">Date Ingested</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1faee]">
                {filteredDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-[#f8fbf9] transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col min-w-0">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="font-bold text-[#1b4332] hover:text-[#40916c] transition-colors truncate max-w-sm sm:max-w-md"
                      >
                        {doc.title || "Untitled Document"}
                      </Link>
                      {doc.original_url && (
                        <a
                          href={doc.original_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#6b8f7e] hover:text-[#40916c] truncate max-w-xs mt-0.5"
                        >
                          {doc.original_url}
                        </a>
                      )}
                      {doc.error_message && (
                        <span className="text-[11px] text-rose-600 font-medium truncate mt-0.5">
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

                  <td className="px-4 py-4 text-center whitespace-nowrap font-mono font-bold text-[#40916c]">
                    {doc.chunk_count || 0}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-[#6b8f7e]">
                    {formatDate(doc.created_at)}
                  </td>

                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="p-1.5 rounded-lg text-[#52796f] hover:text-[#1b4332] hover:bg-[#f1faee] transition-colors"
                        title="View details"
                      >
                        <PiEyeLight size={18} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDocToDelete(doc)}
                        className="p-1.5 rounded-lg text-[#52796f] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
      )}

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
    </div>
  );
};
