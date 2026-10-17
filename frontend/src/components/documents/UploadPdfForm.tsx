"use client";

import React, { useState } from "react";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { Button } from "@/components/ui/Button";
import { useDocuments } from "@/hooks/useDocuments";
import { useToast } from "@/contexts/ToastContext";

export interface UploadPdfFormProps {
  onSuccess?: () => void;
}

export const UploadPdfForm: React.FC<UploadPdfFormProps> = ({ onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { uploadPdf, isUploadingPdf } = useDocuments();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a PDF file first.");
      return;
    }
    setError(null);
    try {
      await uploadPdf(selectedFile);
      toast.success("PDF uploaded successfully. Processing vectors in background.");
      setSelectedFile(null);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || "Failed to upload PDF file.");
      toast.error(err?.message || "Upload failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FileDropzone
        accept=".pdf"
        selectedFile={selectedFile}
        onFileSelect={(file) => {
          setSelectedFile(file);
          setError(null);
        }}
        onClear={() => setSelectedFile(null)}
        disabled={isUploadingPdf}
        error={error || undefined}
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isUploadingPdf}
          disabled={!selectedFile || isUploadingPdf}
        >
          Upload & Segment PDF
        </Button>
      </div>
    </form>
  );
};
