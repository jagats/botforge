"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { UploadModal } from "@/components/documents/UploadModal";
import { useDocuments } from "@/hooks/useDocuments";

export default function DocumentsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { documents, isLoading, deleteDocument, isDeleting } = useDocuments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base & Documents"
        description="Upload PDF files, link web pages, or paste FAQs. BotForge automatically segments and embeds your data into Qdrant for strictly grounded chatbot answers."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Documents" },
        ]}
        action={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsUploadOpen(true)}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Content
          </Button>
        }
      />

      <DocumentTable
        documents={documents}
        isLoading={isLoading}
        onDelete={async (id) => {
          await deleteDocument(id);
        }}
        isDeleting={isDeleting}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
