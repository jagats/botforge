"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentApi } from "../../../lib/api";
import { Document } from "../../../types";

type TabType = "pdf" | "url" | "faq";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("pdf");

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlTitleInput, setUrlTitleInput] = useState("");
  const [faqTitleInput, setFaqTitleInput] = useState("");
  const [faqTextInput, setFaqTextInput] = useState("");

  // Feedback states
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch documents list with dynamic polling if any document is processing
  const { data, isLoading, error } = useQuery({
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
      setUrlInput("");
      setUrlTitleInput("");
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
      setFaqTitleInput("");
      setFaqTextInput("");
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

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    uploadUrlMutation.mutate({
      url: urlInput.trim(),
      title: urlTitleInput.trim() || undefined,
    });
  };

  const handleFaqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqTitleInput.trim() || !faqTextInput.trim()) return;
    uploadFaqMutation.mutate({
      title: faqTitleInput.trim(),
      faq_text: faqTextInput.trim(),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Knowledge Base & Documents
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Upload PDF files, link web pages, or paste FAQs. BotForge automatically segments and embeds
          your data into Qdrant for strictly grounded chatbot answers.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            backgroundColor: "var(--success-glow)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "var(--radius-md)",
            color: "#34d399",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {actionError && <div className="alert-error">⚠️ {actionError}</div>}

      {/* Upload & Ingestion Card */}
      <div className="card">
        {/* Source Switcher Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <button
            type="button"
            className={`btn ${activeTab === "pdf" ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
            onClick={() => setActiveTab("pdf")}
          >
            📑 Upload PDF
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "url" ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
            onClick={() => setActiveTab("url")}
          >
            🌐 Web Page URL
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "faq" ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
            onClick={() => setActiveTab("faq")}
          >
            ✍️ FAQ / Text Snippet
          </button>
        </div>

        {/* Tab 1: PDF Upload Dropzone */}
        {activeTab === "pdf" && (
          <form onSubmit={handlePdfSubmit}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? "var(--accent)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "2.5rem 1.5rem",
                textAlign: "center",
                backgroundColor: isDragging ? "var(--accent-glow)" : "rgba(10, 13, 20, 0.4)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => document.getElementById("pdf-file-input")?.click()}
            >
              <input
                id="pdf-file-input"
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📄</div>
              {selectedFile ? (
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "1rem" }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  <span className="badge" style={{ marginTop: "0.75rem" }}>
                    Click or drag another to replace
                  </span>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "1rem" }}>
                    Drop your PDF here, or <span style={{ color: "var(--accent)" }}>browse files</span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
                    Standard searchable PDFs up to 20MB
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!selectedFile || uploadPdfMutation.isPending}
              >
                {uploadPdfMutation.isPending ? "Uploading & Vectorizing..." : "Upload & Vectorize PDF"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: URL Scraper Form */}
        {activeTab === "url" && (
          <form onSubmit={handleUrlSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Website or Page URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/faq or https://docs.example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Custom Title (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Pricing & Policy Page"
                value={urlTitleInput}
                onChange={(e) => setUrlTitleInput(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!urlInput.trim() || uploadUrlMutation.isPending}
              >
                {uploadUrlMutation.isPending ? "Scraping & Ingesting..." : "Fetch & Ingest URL"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: FAQ / Direct Text Form */}
        {activeTab === "faq" && (
          <form onSubmit={handleFaqSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Document Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Return Policy or Office Hours"
                value={faqTitleInput}
                onChange={(e) => setFaqTitleInput(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Knowledge Content / FAQ Text</label>
              <textarea
                className="form-input"
                rows={6}
                placeholder="Enter facts, questions & answers, or policies that your chatbot should know..."
                value={faqTextInput}
                onChange={(e) => setFaqTextInput(e.target.value)}
                style={{ resize: "vertical", fontFamily: "inherit" }}
                required
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!faqTitleInput.trim() || !faqTextInput.trim() || uploadFaqMutation.isPending}
              >
                {uploadFaqMutation.isPending ? "Chunking & Vectorizing..." : "Save & Vectorize FAQ"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Documents Table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 className="card-title" style={{ fontSize: "1.2rem", margin: 0 }}>
            Indexed Documents ({documents.length})
          </h2>
          {isLoading && <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Refreshing...</span>}
        </div>

        {documents.length === 0 ? (
          <div
            style={{
              padding: "3rem 1rem",
              textAlign: "center",
              color: "var(--text-muted)",
              border: "1px dashed var(--border-color)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📚</div>
            <div style={{ fontWeight: 600, color: "var(--text-main)", marginBottom: "0.25rem" }}>
              No documents in your knowledge base yet
            </div>
            <p style={{ fontSize: "0.85rem" }}>
              Upload your first PDF or FAQ snippet using the form above to start training your bot.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <th style={{ padding: "0.75rem 1rem" }}>Document</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Type</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Vectors</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Added</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc: Document) => {
                  const isProcessing = doc.status === "pending" || doc.status === "processing";

                  return (
                    <tr
                      key={doc.id}
                      style={{
                        borderBottom: "1px solid rgba(35, 49, 82, 0.4)",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* Title & Origin */}
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {doc.title}
                        </div>
                        {doc.original_url && (
                          <a
                            href={doc.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--accent)",
                              display: "inline-block",
                              marginTop: "0.2rem",
                            }}
                          >
                            🔗 {doc.original_url}
                          </a>
                        )}
                        {doc.error_message && (
                          <div
                            style={{
                              color: "#f87171",
                              fontSize: "0.75rem",
                              marginTop: "0.25rem",
                            }}
                          >
                            Error: {doc.error_message}
                          </div>
                        )}
                      </td>

                      {/* Source Type Badge */}
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.6rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            background: "rgba(148, 163, 184, 0.1)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {doc.source_type === "pdf" && "📑 PDF"}
                          {doc.source_type === "url" && "🌐 URL"}
                          {doc.source_type === "faq_text" && "✍️ FAQ"}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "1rem" }}>
                        {doc.status === "ready" && (
                          <span
                            className="badge badge-success"
                            style={{ margin: 0, padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                          >
                            Ready
                          </span>
                        )}
                        {isProcessing && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: "rgba(59, 130, 246, 0.15)",
                              color: "#60a5fa",
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                            }}
                          >
                            <span className="status-dot"></span>
                            {doc.status === "pending" ? "Pending" : "Processing"}
                          </span>
                        )}
                        {doc.status === "failed" && (
                          <span
                            style={{
                              padding: "0.2rem 0.6rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: "var(--error-glow)",
                              color: "#f87171",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                            }}
                          >
                            Failed
                          </span>
                        )}
                      </td>

                      {/* Vector Chunk count */}
                      <td style={{ padding: "1rem", color: "var(--text-main)", fontWeight: 600 }}>
                        {doc.chunk_count} {doc.chunk_count === 1 ? "chunk" : "chunks"}
                      </td>

                      {/* Created date */}
                      <td style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                          className="btn btn-danger"
                          style={{
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.8rem",
                          }}
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
