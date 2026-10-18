"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { UploadModal } from "@/components/documents/UploadModal";
import { useDocuments } from "@/hooks/useDocuments";
import { PiPlusLight } from "react-icons/pi";

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
            variant="accent"
            size="md"
            onClick={() => setIsUploadOpen(true)}
            leftIcon={<PiPlusLight size={16} />}
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
