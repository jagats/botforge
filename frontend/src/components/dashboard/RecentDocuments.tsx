"use client";

import React from "react";
import Link from "next/link";
import { Document } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import {
  PiFilePdfLight,
  PiLinkLight,
  PiChatTextLight,
  PiFileTextLight,
} from "react-icons/pi";

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
        return <PiFilePdfLight size={18} className="text-[#DDD0C8]" />;
      case "url":
        return <PiLinkLight size={18} className="text-[#DDD0C8]" />;
      case "faq":
      case "faq_text":
        return <PiChatTextLight size={18} className="text-[#DDD0C8]" />;
      default:
        return <PiFileTextLight size={18} className="text-[#DDD0C8]" />;
    }
  };

  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#F5EDE8]">
            Recent Knowledge Documents
          </h3>
          <p className="text-xs text-[#C4B4A8]">
            Latest files, webpages, and QA pairs ingested into your Qdrant index.
          </p>
        </div>
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="sm" className="text-[#DDD0C8] hover:text-[#F5EDE8]">
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
              <tr className="border-b border-[rgba(221,208,200,0.15)] text-xs font-semibold text-[#C4B4A8] uppercase tracking-wider">
                <th className="pb-3 px-2">Document</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2">Chunks</th>
                <th className="pb-3 px-2 hidden sm:table-cell">Created</th>
                <th className="pb-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(221,208,200,0.10)] text-[#F5EDE8]">
              {recent.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-[rgba(221,208,200,0.06)] transition-colors group"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1 rounded-md bg-[#323232] border border-[rgba(221,208,200,0.20)]">
                        {getDocTypeIcon(doc.source_type || "pdf")}
                      </span>
                      <div>
                        <Link
                          href={`/dashboard/documents/${doc.id}`}
                          className="font-semibold text-[#F5EDE8] group-hover:text-[#DDD0C8] transition-colors line-clamp-1 max-w-[200px] sm:max-w-xs"
                        >
                          {doc.title || "Untitled Document"}
                        </Link>
                        <span className="text-[11px] text-[#7A6E68] uppercase tracking-wider font-mono">
                          {doc.source_type === "faq_text" ? "FAQ" : (doc.source_type || "PDF").toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-2">
                    <DocumentStatusBadge status={doc.status} />
                  </td>

                  <td className="py-3 px-2 text-xs font-mono text-[#DDD0C8]">
                    {doc.chunk_count ? `${doc.chunk_count} chunks` : "—"}
                  </td>

                  <td className="py-3 px-2 text-xs text-[#7A6E68] hidden sm:table-cell">
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
