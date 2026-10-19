"use client";

import React from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-1.5 p-1.5 rounded-[5px] bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.18)] backdrop-blur-xs ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[4px] text-xs font-medium transition-all duration-150 cursor-pointer ${
              isActive
                ? "bg-[#323232] text-[#F5EDE8] shadow-xs border border-[rgba(221,208,200,0.25)] font-semibold"
                : "text-[#C4B4A8] hover:text-[#F5EDE8] hover:bg-[rgba(221,208,200,0.08)]"
            }`}
          >
            {tab.icon && <span className="text-current">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1.5 px-2 py-0.5 rounded-[3px] text-[10px] font-bold ${
                  isActive
                    ? "bg-[rgba(221,208,200,0.20)] text-[#DDD0C8]"
                    : "bg-[rgba(221,208,200,0.10)] text-[#7A6E68]"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
