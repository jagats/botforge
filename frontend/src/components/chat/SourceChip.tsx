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
    <div className="mt-3 pt-2.5 border-t border-[rgba(221,208,200,0.15)]">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#DDD0C8] hover:text-[#F5EDE8] transition cursor-pointer"
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
                  className="px-3 py-1.5 rounded-md bg-[#232020] border border-[rgba(221,208,200,0.20)] text-xs text-[#DDD0C8] font-mono"
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
