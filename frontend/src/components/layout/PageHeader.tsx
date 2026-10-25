"use client";

import React from "react";
import { BreadcrumbNav, BreadcrumbItem } from "./BreadcrumbNav";

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  badge,
  action,
  children,
  className = "",
}) => {
  return (
    <div className={`space-y-3 pb-6 border-b border-[#e0ece4] ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <BreadcrumbNav items={breadcrumbs} className="mb-2" />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1b4332]">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-[#52796f] max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
      </div>

      {children}
    </div>
  );
};
