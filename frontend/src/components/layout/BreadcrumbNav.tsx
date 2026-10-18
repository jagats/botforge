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
      <ol className="flex items-center space-x-1.5 text-[#7A6E68]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <PiCaretRightLight className="mx-1 h-3 w-3 shrink-0 text-[#7A6E68]" />
              )}
              {isLast || !item.href ? (
                <span className="font-semibold text-[#F5EDE8] truncate max-w-[200px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-[#DDD0C8] transition-colors truncate max-w-[150px] text-[#C4B4A8]"
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
