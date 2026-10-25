"use client";

import React from "react";
import Link from "next/link";
import { PiCaretRightLight } from "react-icons/pi";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items, className = "" }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs font-medium ${className}`}>
      <ol className="flex items-center space-x-1.5 text-[#6b8f7e]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <PiCaretRightLight className="mx-1 h-3 w-3 shrink-0 text-[#6b8f7e]" />
              )}
              {isLast || !item.href ? (
                <span className="font-bold text-[#1b4332] truncate max-w-[200px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-[#40916c] transition-colors truncate max-w-[150px] text-[#52796f] font-semibold"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
