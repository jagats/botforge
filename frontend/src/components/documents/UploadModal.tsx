"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { UploadPdfForm } from "./UploadPdfForm";
import { UploadUrlForm } from "./UploadUrlForm";
import { UploadFaqForm } from "./UploadFaqForm";

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<string>("pdf");

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const tabs: TabItem[] = [
    { id: "pdf", label: "PDF Document" },
    { id: "url", label: "Web Page URL" },
    { id: "faq", label: "FAQ Snippet" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Content to Knowledge Base"
      description="Upload business documents or website data to train your AI chatbot."
      size="lg"
    >
      <div className="space-y-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="w-full"
        />

        <div className="pt-2">
          {activeTab === "pdf" && <UploadPdfForm onSuccess={handleSuccess} />}
          {activeTab === "url" && <UploadUrlForm onSuccess={handleSuccess} />}
          {activeTab === "faq" && <UploadFaqForm onSuccess={handleSuccess} />}
        </div>
      </div>
    </Modal>
  );
};
