"use client";

import React, { useState } from "react";
import { useFormik } from "formik";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { useDocuments } from "@/hooks/useDocuments";
import { documentFaqSchema, DocumentFaqFormValues } from "@/lib/validations";
import { useToast } from "@/contexts/ToastContext";
import { PiWarningCircleLight, PiChatTextLight } from "react-icons/pi";

export interface UploadFaqFormProps {
  onSuccess?: () => void;
}

export const UploadFaqForm: React.FC<UploadFaqFormProps> = ({ onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const { uploadFaq, isUploadingFaq } = useDocuments();
  const { toast } = useToast();

  const formik = useFormik<DocumentFaqFormValues>({
    initialValues: {
      title: "",
      faq_text: "",
    },
    validationSchema: documentFaqSchema,
    onSubmit: async (values, { resetForm }) => {
      setError(null);
      try {
        await uploadFaq({
          title: values.title.trim(),
          faq_text: values.faq_text.trim(),
        });
        toast.success("FAQ snippet saved and vectorized.");
        resetForm();
        onSuccess?.();
      } catch (err: any) {
        setError(err?.message || "Failed to save FAQ content.");
        toast.error(err?.message || "FAQ submission failed");
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <PiWarningCircleLight size={16} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <Input
        id="title"
        name="title"
        type="text"
        label="FAQ Topic Title"
        placeholder="e.g. Return & Refund Policy 2026"
        leftIcon={<PiChatTextLight size={16} />}
        value={formik.values.title}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.title ? formik.errors.title : undefined}
        disabled={isUploadingFaq}
      />

      <TextArea
        id="faq_text"
        name="faq_text"
        label="Q&A Content / Text Snippet"
        rows={6}
        placeholder="Q: What is your return window?&#10;A: Customers can return unopened items within 30 days of purchase for a full refund..."
        value={formik.values.faq_text}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.faq_text ? formik.errors.faq_text : undefined}
        disabled={isUploadingFaq}
        hint="Paste raw Q&A pairs, instructions, or documentation text."
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="accent"
          size="md"
          isLoading={isUploadingFaq}
          disabled={isUploadingFaq}
        >
          Save & Vectorize FAQ
        </Button>
      </div>
    </form>
  );
};
