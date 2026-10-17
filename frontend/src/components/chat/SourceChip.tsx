"use client";

import React, { useState } from "react";
import { ChatSourceItem } from "@/types";
import { SourceCard } from "./SourceCard";

export interface SourceChipProps {
  chunks?: ChatSourceItem[];
  sources?: string[];
}

export const SourceChip: React.FC<SourceChipProps> = ({ chunks = [], sources = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const count = chunks.length > 0 ? chunks.length : sources.length;

  if (count === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-200/60">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
      >
        <span className={`transform transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
          ▸
        </span>
        <span>
          {count} Grounded Context {count === 1 ? "Chunk" : "Chunks"}
        </span>
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
                  className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs text-slate-600 font-mono"
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
