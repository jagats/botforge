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
      <h3 className="text-sm font-bold text-[#F5EDE8] tracking-tight">
        Quick Action Hub
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const content = (
            <GlassCard
              className="p-5 transition-all duration-200 cursor-pointer border-[rgba(221,208,200,0.18)] hover:border-[#DDD0C8] hover:bg-[rgba(221,208,200,0.16)] hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="p-2.5 rounded-md bg-[#323232] text-[#DDD0C8] border border-[rgba(221,208,200,0.20)] shadow-2xs group-hover:scale-110 transition-transform">
                  {act.icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[rgba(221,208,200,0.12)] text-[#DDD0C8] border border-[rgba(221,208,200,0.18)] font-mono">
                  {act.badge}
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#F5EDE8] group-hover:text-[#DDD0C8] transition-colors">
                {act.title}
              </h4>
              <p className="text-xs text-[#C4B4A8] mt-1 line-clamp-2 leading-relaxed">
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
