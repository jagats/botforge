"use client";

import React from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  PiUploadSimpleLight,
  PiChatCircleDotsLight,
  PiCodeLight,
  PiSlidersLight,
} from "react-icons/pi";

export interface QuickActionsProps {
  onUploadClick?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onUploadClick }) => {
  const actions = [
    {
      title: "Upload Knowledge",
      description: "Ingest PDFs, scrape websites, or add FAQ QA pairs into vector memory.",
      icon: <PiUploadSimpleLight size={22} />,
      href: "/dashboard/documents",
      onClick: onUploadClick,
      badge: "Ingestion",
    },
    {
      title: "Chat Playground",
      description: "Test bot responses against your ingested knowledge base in real-time.",
      icon: <PiChatCircleDotsLight size={22} />,
      href: "/dashboard/chat-playground",
      badge: "Testing",
    },
    {
      title: "Embed Widget",
      description: "Copy the 1-line script tag to launch the floating chat widget on any website.",
      icon: <PiCodeLight size={22} />,
      href: "/dashboard/widget-embed",
      badge: "Integration",
    },
    {
      title: "Brand Settings",
      description: "Customize welcome messages, bot identity, and manage tenant credentials.",
      icon: <PiSlidersLight size={22} />,
      href: "/dashboard/settings",
      badge: "Config",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#1b4332] tracking-tight">
        Quick Action Hub
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const content = (
            <GlassCard
              className="p-5 transition-all duration-200 cursor-pointer border-[#d8f3dc] hover:border-[#40916c] hover:bg-[#f8fbf9] hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-[#d8f3dc] text-[#2d6a4f] border border-[#b7e4c7] shadow-2xs group-hover:scale-110 transition-transform">
                  {act.icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#f1faee] text-[#40916c] border border-[#d8f3dc] font-mono">
                  {act.badge}
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#1b4332] group-hover:text-[#40916c] transition-colors">
                {act.title}
              </h4>
              <p className="text-xs text-[#52796f] mt-1 line-clamp-2 leading-relaxed">
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
