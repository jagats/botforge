"use client";

import React, { useState } from "react";
import { ChatSourceItem } from "@/types";
import { SourceCard } from "./SourceCard";
import { PiBookOpenLight, PiCaretRightLight } from "react-icons/pi";

export interface SourceChipProps {
  chunks?: ChatSourceItem[];
  sources?: string[];
}

export const SourceChip: React.FC<SourceChipProps> = ({ chunks = [], sources = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const count = chunks.length > 0 ? chunks.length : sources.length;

  if (count === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-[#e0ece4]">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#40916c] hover:text-[#2d6a4f] transition cursor-pointer"
      >
        <PiBookOpenLight size={14} />
        <span>
          {count} Grounded Context {count === 1 ? "Chunk" : "Chunks"}
        </span>
        <PiCaretRightLight
          size={12}
          className={`transform transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2.5 animate-slide-down">
          {chunks.length > 0 ? (
            chunks.map((chunk, idx) => (
              <SourceCard key={chunk.chunk_id || idx} chunk={chunk} index={idx} />
            ))
          ) : (
            <div className="space-y-1">
              {sources.map((s, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#d8f3dc] text-xs text-[#1b4332] font-mono shadow-2xs"
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
