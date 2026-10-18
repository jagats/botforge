"use client";

import React from "react";
import Link from "next/link";
import { Document } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export interface RecentDocumentsProps {
  documents: Document[];
  isLoading?: boolean;
  onUploadClick?: () => void;
}

export const RecentDocuments: React.FC<RecentDocumentsProps> = ({
  documents,
  isLoading = false,
  onUploadClick,
}) => {
  const recent = documents.slice(0, 5);

  const getDocTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return "📄";
      case "url":
        return "🌐";
      case "faq":
        return "💬";
      default:
        return "📝";
    }
  };

  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Recent Knowledge Documents
          </h3>
          <p className="text-xs text-slate-600">
            Latest files, webpages, and QA pairs ingested into your Qdrant index.
          </p>
        </div>
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
            View All Documents →
          </Button>
        </Link>
      </div>

      {recent.length === 0 && !isLoading ? (
        <EmptyState
          title="No documents yet"
          description="Upload a PDF manual, scrape a web page, or add FAQs to start training your assistant."
          action={
            onUploadClick
              ? {
                  label: "Upload First Document",
                  onClick: onUploadClick,
                }
              : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="pb-3 px-2">Document</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2">Chunks</th>
                <th className="pb-3 px-2 hidden sm:table-cell">Created</th>
                <th className="pb-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 text-slate-700">
              {recent.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">
                        {getDocTypeIcon(doc.source_type || "pdf")}
                      </span>
                      <div>
                        <Link
                          href={`/dashboard/documents/${doc.id}`}
                          className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 max-w-[200px] sm:max-w-xs"
                        >
                          {doc.title || "Untitled Document"}
                        </Link>
                        <span className="text-[11px] text-slate-600 uppercase tracking-wider font-mono">
                          {doc.source_type === "faq_text" ? "FAQ" : (doc.source_type || "PDF").toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-2">
                    <DocumentStatusBadge status={doc.status} />
                  </td>

                  <td className="py-3 px-2 text-xs font-mono text-slate-600">
                    {doc.chunk_count ? `${doc.chunk_count} chunks` : "—"}
                  </td>

                  <td className="py-3 px-2 text-xs text-slate-600 hidden sm:table-cell">
                    {formatDate(doc.created_at)}
                  </td>

                  <td className="py-3 px-2 text-right">
                    <Link href={`/dashboard/documents/${doc.id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
};
