"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

export default function DashboardOverviewPage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Welcome Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(17, 23, 38, 0.8) 100%)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        <div>
          <span className="badge">Phase 1 Complete: Auth & Multi-Tenancy</span>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            Welcome, {user?.company_name || "Partner"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "600px" }}>
            Your dedicated multi-tenant workspace is live. All your data, documents, and chatbot
            conversations are strictly isolated under Tenant ID <code>{user?.tenant_id}</code>.
          </p>
        </div>
        <Link href="/dashboard/settings" className="btn btn-primary">
          ⚙️ View API Key & Embed Snippet
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid" style={{ marginTop: 0, marginBottom: "2rem" }}>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Knowledge Documents
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-main)" }}>0</div>
          <p className="card-desc" style={{ marginTop: "0.5rem" }}>
            Ready for Phase 2 ingestion (PDF, FAQ text, web URLs).
          </p>
        </div>

        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Total Conversations
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-main)" }}>0</div>
          <p className="card-desc" style={{ marginTop: "0.5rem" }}>
            Will track visitor conversations in Phase 3.
          </p>
        </div>

        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Active Subscription
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)", textTransform: "capitalize" }}>
            Trial Plan
          </div>
          <p className="card-desc" style={{ marginTop: "0.5rem" }}>
            Full access to document ingestion and vector retrieval.
          </p>
        </div>

        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Tenant Isolation
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "#34d399" }}>
            <span className="status-dot"></span> Active & Scoped
          </div>
          <p className="card-desc" style={{ marginTop: "0.5rem" }}>
            Authenticated via signed JWT tokens.
          </p>
        </div>
      </div>

      {/* Next Phase Guide */}
      <div
        className="card"
        style={{
          borderLeft: "4px solid var(--accent)",
          background: "var(--bg-secondary)",
        }}
      >
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          🚀 Ready for Phase 2: Document Ingestion & Qdrant Vectors
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "1rem" }}>
          The backend database schema, user accounts, and API key infrastructure are fully operating.
          The next step will allow uploading PDFs, website URLs, and FAQs, chunking them into semantic fragments,
          and storing vectors in Qdrant with your tenant ID filter.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/dashboard/settings" className="btn btn-secondary">
            Settings & Embed Code &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
