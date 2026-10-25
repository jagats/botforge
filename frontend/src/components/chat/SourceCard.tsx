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
    <div className="p-3.5 rounded-xl bg-[#f8fbf9] border border-[#d8f3dc] text-xs text-[#1b4332] space-y-2 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {index !== undefined && (
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#d8f3dc] text-[#1b4332] border border-[#b7e4c7] font-bold text-[11px]">
              {index + 1}
            </span>
          )}
          <span className="font-mono text-[11px] text-[#6b8f7e] truncate max-w-[200px]">
            Doc: {chunk.document_id.slice(0, 8)}...
          </span>
        </div>

        {chunk.score !== undefined && (
          <Badge variant="info" size="sm">
            Similarity {(chunk.score * 100).toFixed(0)}%
          </Badge>
        )}
      </div>

      <div className="p-2.5 rounded-xl bg-[#ffffff] border border-[#d8f3dc] font-mono text-[11px] text-[#3f5e50] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap shadow-inner">
        &ldquo;{chunk.text}&rdquo;
      </div>
    </div>
  );
};
