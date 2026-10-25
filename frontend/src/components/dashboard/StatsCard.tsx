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
    indigo: "bg-[#d8f3dc] text-[#2d6a4f] border-[#b7e4c7]",
    emerald: "bg-[#d8f3dc] text-[#40916c] border-[#b7e4c7]",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    purple: "bg-[#d8f3dc] text-[#1b4332] border-[#95d5b2]",
    cyan: "bg-sky-100 text-sky-700 border-sky-200",
  }[color];

  return (
    <GlassCard
      className={`p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#52796f] uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1b4332] tracking-tight">
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-semibold inline-flex items-center gap-0.5 ${
                  trend.positive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                <span>{trend.positive ? "↑" : "↓"}</span>
                <span>{trend.value}</span>
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[#6b8f7e] font-medium">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center border shadow-xs shrink-0 ${iconBgStyles}`}
          >
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
