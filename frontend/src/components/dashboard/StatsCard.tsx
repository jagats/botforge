"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  color?: "indigo" | "emerald" | "amber" | "purple" | "cyan";
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "indigo",
  className = "",
}) => {
  const iconBgStyles = {
    indigo: "bg-[rgba(221,208,200,0.12)] text-[#DDD0C8] border-[rgba(221,208,200,0.25)]",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-400/20 text-amber-300 border-amber-400/30",
    purple: "bg-[#323232] text-[#DDD0C8] border-[rgba(221,208,200,0.25)]",
    cyan: "bg-sky-400/20 text-sky-300 border-sky-400/30",
  }[color];

  return (
    <GlassCard
      className={`p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#C4B4A8] uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F5EDE8] tracking-tight">
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-semibold inline-flex items-center gap-0.5 ${
                  trend.positive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                <span>{trend.positive ? "↑" : "↓"}</span>
                <span>{trend.value}</span>
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[#7A6E68] font-medium">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div
            className={`h-11 w-11 rounded-md flex items-center justify-center border shadow-xs shrink-0 ${iconBgStyles}`}
          >
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
