"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="status-dot" style={{ width: 14, height: 14, marginBottom: 12 }}></div>
          <p>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: "📊" },
    { label: "Documents", href: "/dashboard/documents", icon: "📄" },
    { label: "Chat Test", href: "/dashboard/chat-test", icon: "💬", badge: "Phase 3" },
    { label: "Settings & Embed", href: "/dashboard/settings", icon: "⚙️" },
  ];

  return (
    <div className="dashboard-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-logo">
            🤖 BotForge
          </Link>
          <span className="badge badge-success" style={{ margin: 0, padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}>
            Active
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isDisabled = item.badge === "Phase 2" || item.badge === "Phase 3";

            return (
              <Link
                key={item.href}
                href={isDisabled ? "#" : item.href}
                className={`nav-link ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                style={{ justifyContent: "space-between" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "4px",
                      background: "rgba(148, 163, 184, 0.15)",
                      color: "var(--text-dim)",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-snippet">
            <div className="user-email" title={user.email}>
              {user.email}
            </div>
            <div className="user-company">{user.company_name || "Workspace"}</div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="btn btn-outline"
            style={{ width: "100%", fontSize: "0.85rem", padding: "0.5rem" }}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="top-bar">
          <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
            {user.company_name} Dashboard
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Role: <strong style={{ color: "var(--text-main)" }}>{user.role}</strong>
            </span>
          </div>
        </header>

        <main className="dashboard-body">{children}</main>
      </div>
    </div>
  );
}
