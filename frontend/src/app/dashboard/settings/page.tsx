"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();

  const [companyNameInput, setCompanyNameInput] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch tenant profile
  const {
    data: tenant,
    isLoading: isLoadingTenant,
    error: tenantError,
  } = useQuery({
    queryKey: ["tenantProfile"],
    queryFn: tenantApi.getProfile,
  });

  // Fetch widget API key
  const {
    data: apiKey,
    isLoading: isLoadingKey,
    error: keyError,
  } = useQuery({
    queryKey: ["tenantApiKey"],
    queryFn: tenantApi.getApiKey,
  });

  // Mutation to update company name
  const updateMutation = useMutation({
    mutationFn: (newName: string) => tenantApi.updateProfile({ name: newName }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenantProfile"] });
      await refreshUser();
      setIsEditingName(false);
      setSaveError(null);
    },
    onError: (err: any) => {
      setSaveError(err?.message || "Failed to update company name");
    },
  });

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyNameInput.trim()) return;
    updateMutation.mutate(companyNameInput.trim());
  };

  const embedSnippet = apiKey
    ? `<script src="http://localhost:8000/widget.js" data-public-key="${apiKey.public_key}" async></script>`
    : "";

  const handleCopy = () => {
    if (!embedSnippet) return;
    navigator.clipboard.writeText(embedSnippet);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  if (isLoadingTenant || isLoadingKey) {
    return (
      <div style={{ color: "var(--text-muted)", padding: "2rem 0" }}>
        Loading workspace configuration...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Workspace Settings & Embed
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Manage your organization profile, review API credentials, and integrate the chatbot snippet.
        </p>
      </div>

      {saveError && <div className="alert-error">{saveError}</div>}

      {/* Organization Details */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: "1.25rem", fontSize: "1.15rem" }}>
          🏢 Organization Profile
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          <div>
            <label className="form-label">Company Name</label>
            {!isEditingName ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>{tenant?.name}</span>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                  onClick={() => {
                    setCompanyNameInput(tenant?.name || "");
                    setIsEditingName(true);
                  }}
                >
                  Edit
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveName} style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                <input
                  type="text"
                  className="form-input"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  style={{ maxWidth: "260px" }}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
                  onClick={() => setIsEditingName(false)}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          <div>
            <label className="form-label">Workspace Slug</label>
            <div style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
              <code>{tenant?.slug}</code>
            </div>
          </div>

          <div>
            <label className="form-label">Subscription Plan</label>
            <span className="badge badge-success" style={{ margin: 0, textTransform: "capitalize" }}>
              {tenant?.plan}
            </span>
          </div>

          <div>
            <label className="form-label">Tenant ID (Isolated Partition)</label>
            <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              <code>{tenant?.id}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Embed Code */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: "0.5rem", fontSize: "1.15rem" }}>
          🔌 Embed Chatbot on your Website
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
          Paste this single tag into the <code>&lt;head&gt;</code> or <code>&lt;body&gt;</code> of your website.
          The widget will safely communicate with BotForge using your tenant&apos;s public API key.
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Public API Key: <code>{apiKey?.public_key}</code>
            </span>
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
            >
              {copyFeedback ? "✅ Copied!" : "📋 Copy Snippet"}
            </button>
          </div>
          <pre className="code-snippet">{embedSnippet}</pre>
        </div>
      </div>
    </div>
  );
}
