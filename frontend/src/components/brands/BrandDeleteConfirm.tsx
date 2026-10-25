"use client";

import React, { useState } from "react";
import { Brand } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useBrands } from "@/hooks/useBrands";
import { useToast } from "@/contexts/ToastContext";
import { PiWarningCircleLight } from "react-icons/pi";

export interface BrandDeleteConfirmProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export const BrandDeleteConfirm: React.FC<BrandDeleteConfirmProps> = ({
  brand,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const [confirmSlug, setConfirmSlug] = useState("");
  const { deleteBrand, isDeleting } = useBrands();
  const { toast } = useToast();

  if (!brand) return null;

  const isConfirmed = confirmSlug.trim() === brand.slug;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    try {
      await deleteBrand(brand.tenant_id);
      toast.success(`Brand "${brand.name}" offboarded and purged.`);
      setConfirmSlug("");
      onClose();
      onDeleted?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to offboard brand.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setConfirmSlug("");
        onClose();
      }}
      title="Offboard & Purge Client Brand"
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setConfirmSlug("");
              onClose();
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={!isConfirmed || isDeleting}
          >
            Permanently Delete Brand
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-rose-900">
            <PiWarningCircleLight size={16} className="text-rose-600 shrink-0" />
            <span>Critical Action — Irreversible Data Loss</span>
          </p>
          <p className="leading-relaxed">
            This will permanently offboard <strong>{brand.name}</strong>, delete all associated user accounts, documents, conversation sessions, and purge all vector embeddings from Qdrant.
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-[#3f5e50]">
            To confirm deletion, please type the brand slug:{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-rose-100 font-mono font-bold text-rose-700 border border-rose-200">
              {brand.slug}
            </code>
          </p>
          <Input
            id="confirm-slug"
            type="text"
            placeholder={brand.slug}
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
            disabled={isDeleting}
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
};
