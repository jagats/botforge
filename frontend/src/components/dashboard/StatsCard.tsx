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
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
  }[color];

  return (
    <GlassCard
      className={`p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
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
            <p className="text-xs text-slate-600 font-medium">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center border shadow-xs shrink-0 ${iconBgStyles}`}
          >
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
