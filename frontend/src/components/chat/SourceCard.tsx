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
    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {index !== undefined && (
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 font-bold text-[11px]">
              {index + 1}
            </span>
          )}
          <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
            Doc: {chunk.document_id.slice(0, 8)}...
          </span>
        </div>

        {chunk.score !== undefined && (
          <Badge variant="info" size="sm">
            Similarity {(chunk.score * 100).toFixed(0)}%
          </Badge>
        )}
      </div>

      <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 font-mono text-[11px] text-slate-800 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
        &ldquo;{chunk.text}&rdquo;
      </div>
    </div>
  );
};
