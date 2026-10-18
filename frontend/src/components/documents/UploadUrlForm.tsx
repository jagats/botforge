"use client";

import React, { useState } from "react";
import { useFormik } from "formik";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useDocuments } from "@/hooks/useDocuments";
import { documentUrlSchema, DocumentUrlFormValues } from "@/lib/validations";
import { useToast } from "@/contexts/ToastContext";
import { PiWarningCircleLight, PiLinkLight } from "react-icons/pi";

export interface UploadUrlFormProps {
  onSuccess?: () => void;
}

export const UploadUrlForm: React.FC<UploadUrlFormProps> = ({ onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const { uploadUrl, isUploadingUrl } = useDocuments();
  const { toast } = useToast();

  const formik = useFormik<DocumentUrlFormValues>({
    initialValues: {
      url: "",
      title: "",
    },
    validationSchema: documentUrlSchema,
    onSubmit: async (values, { resetForm }) => {
      setError(null);
      try {
        await uploadUrl({
          url: values.url.trim(),
          title: values.title?.trim() || undefined,
        });
        toast.success("URL submitted. Ingestion and vectorization started.");
        resetForm();
        onSuccess?.();
      } catch (err: any) {
        setError(err?.message || "Failed to ingest webpage content.");
        toast.error(err?.message || "URL ingestion failed");
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
        id="url"
        name="url"
        type="url"
        label="Web Page Address (URL)"
        placeholder="https://acmehealth.com/patient-faqs"
        leftIcon={<PiLinkLight size={16} />}
        value={formik.values.url}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.url ? formik.errors.url : undefined}
        disabled={isUploadingUrl}
        hint="Must begin with http:// or https://"
      />

      <Input
        id="title"
        name="title"
        type="text"
        label="Custom Title (Optional)"
        placeholder="e.g. Patient Care FAQ"
        value={formik.values.title}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.title ? formik.errors.title : undefined}
        disabled={isUploadingUrl}
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="accent"
          size="md"
          isLoading={isUploadingUrl}
          disabled={isUploadingUrl}
        >
          Scrape & Ingest URL
        </Button>
      </div>
    </form>
  );
};
