"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import { documentApi } from "../../../lib/api";
import { Document } from "../../../types";
import {
  documentUrlSchema,
  DocumentUrlFormValues,
  documentFaqSchema,
  DocumentFaqFormValues,
} from "../../../lib/validations";

type TabType = "pdf" | "url" | "faq";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("pdf");

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Feedback states
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch documents list with dynamic polling if any document is processing
  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentApi.list,
    refetchInterval: (query) => {
      const docs = query.state.data?.documents || [];
      const hasProcessing = docs.some(
        (doc: Document) => doc.status === "pending" || doc.status === "processing"
      );
      return hasProcessing ? 3000 : false;
    },
  });

  const documents = data?.documents || [];

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setActionError(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Upload PDF Mutation
  const uploadPdfMutation = useMutation({
    mutationFn: (file: File) => documentApi.uploadPdf(file),
    onSuccess: () => {
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showNotification("PDF uploaded successfully. Processing vectors in background.");
    },
    onError: (err: any) => {
      setActionError(err?.message || "Failed to upload PDF file.");
    },
  });

  // Ingest URL Mutation
  const uploadUrlMutation = useMutation({
    mutationFn: (payload: { url: string; title?: string }) =>
      documentApi.uploadUrl(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showNotification("URL submitted. Ingestion and vectorization started.");
    },
    onError: (err: any) => {
      setActionError(err?.message || "Failed to ingest webpage content.");
    },
  });

  // Ingest FAQ Mutation
  const uploadFaqMutation = useMutation({
    mutationFn: (payload: { title: string; faq_text: string }) =>
      documentApi.uploadFaq(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showNotification("FAQ snippet saved and vectorized.");
    },
    onError: (err: any) => {
      setActionError(err?.message || "Failed to save FAQ content.");
    },
  });

  // Delete Document Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showNotification("Document and associated vectors purged.");
    },
    onError: (err: any) => {
      setActionError(err?.message || "Failed to delete document.");
    },
  });

  // Formik for URL Ingestion
  const urlFormik = useFormik<DocumentUrlFormValues>({
    initialValues: {
      url: "",
      title: "",
    },
    validationSchema: documentUrlSchema,
    onSubmit: async (values, { resetForm }) => {
      setActionError(null);
      try {
        await uploadUrlMutation.mutateAsync({
          url: values.url.trim(),
          title: values.title?.trim() || undefined,
        });
        resetForm();
      } catch (err: any) {
        // Error captured by uploadUrlMutation.onError
      }
    },
  });

  // Formik for FAQ Ingestion
  const faqFormik = useFormik<DocumentFaqFormValues>({
    initialValues: {
      title: "",
      faq_text: "",
    },
    validationSchema: documentFaqSchema,
    onSubmit: async (values, { resetForm }) => {
      setActionError(null);
      try {
        await uploadFaqMutation.mutateAsync({
          title: values.title.trim(),
          faq_text: values.faq_text.trim(),
        });
        resetForm();
      } catch (err: any) {
        // Error captured by uploadFaqMutation.onError
      }
    },
  });

  // File drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setSelectedFile(file);
        setActionError(null);
      } else {
        setActionError("Only PDF documents (.pdf) are supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setSelectedFile(file);
        setActionError(null);
      } else {
        setActionError("Only PDF documents (.pdf) are supported.");
      }
    }
  };

  const handlePdfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setActionError("Please select a PDF file first.");
      return;
    }
    uploadPdfMutation.mutate(selectedFile);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
          Knowledge Base & Documents
        </h1>
        <p className="text-sm text-slate-400">
          Upload PDF files, link web pages, or paste FAQs. BotForge automatically segments and embeds
          your data into Qdrant for strictly grounded chatbot answers.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2 shadow-sm">
          <span>✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2 shadow-sm">
          <span>⚠️</span>
          <span>{actionError}</span>
        </div>
      )}

      {/* Ingestion Source Panel */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
        {/* Source Switcher Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4 mb-6">
          <button
            type="button"
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "pdf"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            onClick={() => setActiveTab("pdf")}
          >
            📑 Upload PDF
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "url"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            onClick={() => setActiveTab("url")}
          >
            🌐 Web Page URL
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "faq"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            onClick={() => setActiveTab("faq")}
          >
            ✍️ FAQ / Text Snippet
          </button>
        </div>

        {/* Tab 1: PDF Dropzone */}
        {activeTab === "pdf" && (
          <form onSubmit={handlePdfSubmit}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("pdf-file-input")?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                  : "border-slate-800 hover:border-blue-500/50 bg-slate-950/40 hover:bg-slate-950/70"
              }`}
            >
              <input
                id="pdf-file-input"
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="text-4xl mb-3">📄</div>
              {selectedFile ? (
                <div>
                  <div className="font-semibold text-white text-base">{selectedFile.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    Click or drag another file to replace
                  </span>
                </div>
              ) : (
                <div>
                  <div className="font-semibold text-slate-200 text-base">
                    Drop your PDF here, or <span className="text-blue-400 underline underline-offset-4">browse files</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Standard searchable PDFs up to 20MB
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                disabled={!selectedFile || uploadPdfMutation.isPending}
              >
                {uploadPdfMutation.isPending ? "Uploading & Vectorizing..." : "Upload & Vectorize PDF"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: URL Form */}
        {activeTab === "url" && (
          <form onSubmit={urlFormik.handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="url">
                Target Web Page URL
              </label>
              <input
                id="url"
                name="url"
                type="url"
                className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                  urlFormik.touched.url && urlFormik.errors.url
                    ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500"
                    : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
                }`}
                placeholder="https://example.com/help or https://docs.example.com"
                value={urlFormik.values.url}
                onChange={urlFormik.handleChange}
                onBlur={urlFormik.handleBlur}
                disabled={uploadUrlMutation.isPending}
              />
              {urlFormik.touched.url && urlFormik.errors.url && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <span>•</span>
                  <span>{urlFormik.errors.url}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="url-title">
                Document Title (Optional)
              </label>
              <input
                id="url-title"
                name="title"
                type="text"
                className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                  urlFormik.touched.title && urlFormik.errors.title
                    ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500"
                    : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
                }`}
                placeholder="e.g. Terms of Service or Pricing Page"
                value={urlFormik.values.title}
                onChange={urlFormik.handleChange}
                onBlur={urlFormik.handleBlur}
                disabled={uploadUrlMutation.isPending}
              />
              {urlFormik.touched.title && urlFormik.errors.title && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <span>•</span>
                  <span>{urlFormik.errors.title}</span>
                </p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                disabled={uploadUrlMutation.isPending}
              >
                {uploadUrlMutation.isPending ? "Scraping & Ingesting..." : "Fetch & Ingest URL"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: FAQ Form */}
        {activeTab === "faq" && (
          <form onSubmit={faqFormik.handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="faq-title">
                Document Title
              </label>
              <input
                id="faq-title"
                name="title"
                type="text"
                className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                  faqFormik.touched.title && faqFormik.errors.title
                    ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500"
                    : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
                }`}
                placeholder="e.g. Return Policy or Office Hours"
                value={faqFormik.values.title}
                onChange={faqFormik.handleChange}
                onBlur={faqFormik.handleBlur}
                disabled={uploadFaqMutation.isPending}
              />
              {faqFormik.touched.title && faqFormik.errors.title && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <span>•</span>
                  <span>{faqFormik.errors.title}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="faq-text">
                Knowledge Content / FAQ Text
              </label>
              <textarea
                id="faq-text"
                name="faq_text"
                rows={6}
                className={`w-full px-4 py-3 bg-slate-950/80 border rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all resize-y ${
                  faqFormik.touched.faq_text && faqFormik.errors.faq_text
                    ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500"
                    : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
                }`}
                placeholder="Enter facts, questions & answers, or policies that your chatbot should know..."
                value={faqFormik.values.faq_text}
                onChange={faqFormik.handleChange}
                onBlur={faqFormik.handleBlur}
                disabled={uploadFaqMutation.isPending}
              />
              {faqFormik.touched.faq_text && faqFormik.errors.faq_text && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <span>•</span>
                  <span>{faqFormik.errors.faq_text}</span>
                </p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                disabled={uploadFaqMutation.isPending}
              >
                {uploadFaqMutation.isPending ? "Chunking & Vectorizing..." : "Save & Vectorize FAQ"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>📚</span>
            <span>Indexed Documents ({documents.length})</span>
          </h2>
          {isLoading && <span className="text-xs text-slate-400">Refreshing list...</span>}
        </div>

        {documents.length === 0 ? (
          <div className="py-12 px-4 text-center border border-dashed border-slate-800 rounded-xl">
            <div className="text-3xl mb-2">📄</div>
            <div className="text-sm font-semibold text-slate-200 mb-1">
              No documents in your knowledge base yet
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Upload your first PDF or FAQ snippet using the form above to start training your bot.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="pb-3 px-4">Document</th>
                  <th className="pb-3 px-4">Type</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Vectors</th>
                  <th className="pb-3 px-4">Added</th>
                  <th className="pb-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map((doc: Document) => {
                  const isProcessing = doc.status === "pending" || doc.status === "processing";

                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Title & Origin */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-100">{doc.title}</div>
                        {doc.original_url && (
                          <a
                            href={doc.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 inline-block mt-0.5"
                          >
                            🔗 {doc.original_url}
                          </a>
                        )}
                        {doc.error_message && (
                          <div className="text-xs text-red-400 mt-1">
                            Error: {doc.error_message}
                          </div>
                        )}
                      </td>

                      {/* Source Type Badge */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-slate-800 text-slate-300 border border-slate-700">
                          {doc.source_type === "pdf" && "📑 PDF"}
                          {doc.source_type === "url" && "🌐 URL"}
                          {doc.source_type === "faq_text" && "✍️ FAQ"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {doc.status === "ready" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Ready
                          </span>
                        )}
                        {isProcessing && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            {doc.status === "pending" ? "Pending" : "Processing"}
                          </span>
                        )}
                        {doc.status === "failed" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                            Failed
                          </span>
                        )}
                      </td>

                      {/* Chunk count */}
                      <td className="py-4 px-4 text-slate-200 font-medium">
                        {doc.chunk_count} {doc.chunk_count === 1 ? "chunk" : "chunks"}
                      </td>

                      {/* Created date */}
                      <td className="py-4 px-4 text-slate-400 text-xs">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors disabled:opacity-50"
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
