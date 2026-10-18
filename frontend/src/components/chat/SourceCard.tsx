"use client";

import React from "react";
import { ChatSourceItem } from "@/types";
import { Badge } from "@/components/ui/Badge";

export interface SourceCardProps {
  chunk: ChatSourceItem;
  index?: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ chunk, index }) => {
  return (
    <div className="p-3.5 rounded-md bg-[rgba(221,208,200,0.08)] border border-[rgba(221,208,200,0.18)] text-xs text-[#F5EDE8] space-y-2 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {index !== undefined && (
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#323232] text-[#DDD0C8] border border-[rgba(221,208,200,0.20)] font-bold text-[11px]">
              {index + 1}
            </span>
          )}
          <span className="font-mono text-[11px] text-[#7A6E68] truncate max-w-[200px]">
            Doc: {chunk.document_id.slice(0, 8)}...
          </span>
        </div>

        {chunk.score !== undefined && (
          <Badge variant="info" size="sm">
            Similarity {(chunk.score * 100).toFixed(0)}%
          </Badge>
        )}
      </div>

      <div className="p-2.5 rounded-md bg-[#1E1A17] border border-[rgba(221,208,200,0.15)] font-mono text-[11px] text-[#C4B4A8] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
        &ldquo;{chunk.text}&rdquo;
      </div>
    </div>
  );
};
