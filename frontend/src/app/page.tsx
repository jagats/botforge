"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <main className="container">
      {/* Top Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "3.5rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          🤖 BotForge
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {isAuthenticated ? (
            <>
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                Signed in as <strong style={{ color: "var(--text-main)" }}>{user?.company_name}</strong>
              </span>
              <Link href="/dashboard" className="btn btn-primary">
                Open Dashboard &rarr;
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline">
                Sign In
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Header */}
      <header className="header">
        <span className="badge badge-success">
          <span className="status-dot"></span> Phase 1 Live: Multi-Tenant Auth Ready
        </span>
        <h1 className="title">Grounded AI Chatbots for Your Business</h1>
        <p className="subtitle">
          Multi-tenant AI Bot-as-a-Service platform. Register your company, ingest domain knowledge,
          and deploy an isolated, embeddable chat widget grounded strictly in your client&apos;s data.
        </p>

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
          {isAuthenticated ? (
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: "0.85rem 1.85rem", fontSize: "1.05rem" }}>
              Go to Workspace Dashboard &rarr;
            </Link>
          ) : (
            <>
              <Link href="/signup" className="btn btn-primary" style={{ padding: "0.85rem 1.85rem", fontSize: "1.05rem" }}>
                Create Your Workspace &rarr;
              </Link>
              <Link href="/login" className="btn btn-secondary" style={{ padding: "0.85rem 1.85rem", fontSize: "1.05rem" }}>
                Sign In to Existing Account
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Architecture Cards */}
      <section className="grid">
        <div className="card">
          <h2 className="card-title">
            <span className="status-dot"></span>
            PostgreSQL Multi-Tenant
          </h2>
          <p className="card-desc">
            Port 5432 &bull; Relational schema with isolated tenant records, owner accounts, and public API keys.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">
            <span className="status-dot"></span>
            Qdrant Vector DB
          </h2>
          <p className="card-desc">
            Port 6333 &bull; Fast semantic retrieval engine partitioned strictly by <code>tenant_id</code>.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">
            <span className="status-dot"></span>
            FastAPI Auth & Security
          </h2>
          <p className="card-desc">
            Port 8000 &bull; REST API with bcrypt password hashing, JWT sessions, and dependency-based tenant isolation.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">
            <span className="status-dot"></span>
            Next.js Dashboard
          </h2>
          <p className="card-desc">
            Port 3000 &bull; React 19 + TanStack Query interface with responsive controls and embed widget previews.
          </p>
        </div>
      </section>
    </main>
  );
}
