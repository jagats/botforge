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
  PiShieldCheckLight,
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
    ...(user?.role === "superadmin"
      ? [
          {
            label: "Admin Portal",
            href: "/admin/brands",
            icon: <PiShieldCheckLight size={20} />,
          },
        ]
      : []),
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
    <div className="flex flex-col h-full justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#e0ece4]">
          <Logo collapsed={isCollapsed} href="/dashboard" />

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleCollapse}
            aria-label="Toggle sidebar collapse"
            className="hidden md:flex p-1.5 rounded-lg text-[#52796f] hover:text-[#1b4332] hover:bg-[#f1faee] transition-colors cursor-pointer"
          >
            <PiCaretLeftLight
              size={18}
              className={`transform transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[#40916c] text-[#ffffff] shadow-sm"
                    : "text-[#3f5e50] hover:text-[#1b4332] hover:bg-[#f1faee]"
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
      <div className="p-3 border-t border-[#e0ece4]">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-[#f8fbf9] border border-[#d8f3dc] shadow-2xs ${
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
              <p className="text-xs font-bold text-[#1b4332] truncate">
                {user?.company_name || "Client Brand"}
              </p>
              <p className="text-[11px] text-[#6b8f7e] truncate">{user?.email}</p>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={async () => {
                await logout();
                window.location.href = "/login";
              }}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 rounded-lg text-[#52796f] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
      {/* Desktop Fixed Non-Scrollable Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 fixed left-0 top-0 h-screen z-30 clay-sidebar overflow-hidden transition-all duration-300 ${
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
        className={`fixed inset-y-0 left-0 z-50 w-72 clay-card-elevated md:hidden transition-transform duration-300 shadow-2xl bg-[#ffffff] overflow-hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
