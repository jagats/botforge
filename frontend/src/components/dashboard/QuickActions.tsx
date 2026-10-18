"use client";

import React from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

export interface QuickActionsProps {
  onUploadClick?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onUploadClick }) => {
  const actions = [
    {
      title: "Upload Knowledge",
      description: "Ingest PDFs, scrape websites, or add FAQ QA pairs into vector memory.",
      icon: "📚",
      href: "/dashboard/documents",
      onClick: onUploadClick,
      badge: "Ingestion",
      accent: "hover:border-indigo-300 hover:bg-indigo-50/30",
    },
    {
      title: "Chat Playground",
      description: "Test bot responses against your ingested knowledge base in real-time.",
      icon: "💬",
      href: "/dashboard/chat-playground",
      badge: "Testing",
      accent: "hover:border-purple-300 hover:bg-purple-50/30",
    },
    {
      title: "Embed Widget",
      description: "Copy the 1-line script tag to launch the floating chat widget on any website.",
      icon: "⚡",
      href: "/dashboard/widget-embed",
      badge: "Integration",
      accent: "hover:border-cyan-300 hover:bg-cyan-50/30",
    },
    {
      title: "Brand Settings",
      description: "Customize welcome messages, bot identity, and manage tenant credentials.",
      icon: "⚙️",
      href: "/dashboard/settings",
      badge: "Config",
      accent: "hover:border-emerald-300 hover:bg-emerald-50/30",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-800 tracking-tight">
        Quick Action Hub
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const content = (
            <GlassCard
              className={`p-5 transition-all duration-200 cursor-pointer border-slate-200/80 ${act.accent} hover:shadow-md hover:-translate-y-0.5 group`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl p-2 rounded-xl bg-white shadow-2xs group-hover:scale-110 transition-transform">
                  {act.icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                  {act.badge}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                {act.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {act.description}
              </p>
            </GlassCard>
          );

          if (act.onClick) {
            return (
              <div key={act.title} onClick={act.onClick}>
                {content}
              </div>
            );
          }

          return (
            <Link key={act.title} href={act.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
