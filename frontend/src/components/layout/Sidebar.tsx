"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { Avatar } from "@/components/ui";
import { Logo } from "@/components/layout/Logo";
import {
  PiHouseLight,
  PiFilesLight,
  PiChatCircleDotsLight,
  PiCodeLight,
  PiGearLight,
  PiSignOutLight,
  PiCaretLeftLight,
} from "react-icons/pi";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebar();

  const navItems: NavItem[] = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <PiHouseLight size={20} />,
    },
    {
      label: "Documents",
      href: "/dashboard/documents",
      icon: <PiFilesLight size={20} />,
    },
    {
      label: "Chat Playground",
      href: "/dashboard/chat-playground",
      icon: <PiChatCircleDotsLight size={20} />,
    },
    {
      label: "Widget Embed",
      href: "/dashboard/widget-embed",
      icon: <PiCodeLight size={20} />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <PiGearLight size={20} />,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[rgba(221,208,200,0.15)]">
          <Logo collapsed={isCollapsed} href="/dashboard" />

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleCollapse}
            aria-label="Toggle sidebar collapse"
            className="hidden md:flex p-1.5 rounded-md text-[#C4B4A8] hover:text-[#F5EDE8] hover:bg-[rgba(221,208,200,0.10)] transition-colors cursor-pointer"
          >
            <PiCaretLeftLight
              size={18}
              className={`transform transition-transform ${isCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[rgba(221,208,200,0.18)] text-[#F5EDE8] shadow-xs border border-[rgba(221,208,200,0.30)] font-semibold"
                    : "text-[#C4B4A8] hover:text-[#F5EDE8] hover:bg-[rgba(221,208,200,0.08)]"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[rgba(221,208,200,0.15)]">
        <div
          className={`flex items-center gap-3 p-2 rounded-md bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.18)] shadow-2xs ${
            isCollapsed ? "justify-center p-1.5" : ""
          }`}
        >
          <Avatar
            name={user?.company_name || user?.email || "User"}
            size="sm"
            role="user"
          />

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#F5EDE8] truncate">
                {user?.company_name || "Client Brand"}
              </p>
              <p className="text-[11px] text-[#7A6E68] truncate">{user?.email}</p>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 rounded-md text-[#C4B4A8] hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <PiSignOutLight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 min-h-screen sticky top-0 z-30 glass-sidebar transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 modal-overlay md:hidden animate-fade-in"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 glass-card-elevated md:hidden transition-transform duration-300 shadow-2xl ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
