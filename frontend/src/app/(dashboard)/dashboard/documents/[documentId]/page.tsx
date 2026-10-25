"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DocumentDetail } from "@/components/documents/DocumentDetail";
import { useDocuments } from "@/hooks/useDocuments";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { documentId } = use(params);
  const { useDocumentDetail, deleteDocument, isDeleting } = useDocuments();
  const { data: document, isLoading, error } = useDocumentDetail(documentId);

  const handleDelete = async () => {
    if (!document) return;
    await deleteDocument(document.id);
    router.push("/dashboard/documents");
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs font-semibold text-slate-500">
            Loading document details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <EmptyState
        title="Document Not Found"
        description="The requested document could not be loaded or was removed from your knowledge base."
        action={{
          label: "Back to Documents",
          onClick: () => router.push("/dashboard/documents"),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={document.title || "Document Details"}
        description="Inspect document vector chunks, source attributes, and storage metadata."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Documents", href: "/dashboard/documents" },
          { label: document.title || "Detail" },
        ]}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/dashboard/documents")}
          >
            Back to Documents
          </Button>
        }
      />

      <DocumentDetail
        document={document}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
