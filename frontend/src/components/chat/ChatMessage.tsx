"use client";

import React from "react";
import { ChatSourceItem } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { SourceChip } from "./SourceChip";

export interface ChatMessageProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  sourceChunks?: ChatSourceItem[];
  sources?: string[];
  sessionId?: string | null;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  createdAt,
  sourceChunks,
  sources,
  sessionId,
}) => {
  const isUser = role === "user";

  return (
    <div
      className={`flex items-start gap-3 max-w-3xl ${
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      } animate-fade-in`}
    >
      <Avatar role={isUser ? "user" : "bot"} size="sm" />

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-2xl`}>
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-[#6b8f7e]">
          <span className="font-semibold text-[#1b4332]">
            {isUser ? "You" : "BotForge Assistant"}
          </span>
          {createdAt && (
            <>
              <span>•</span>
              <span>{createdAt}</span>
            </>
          )}
          {sessionId && !isUser && (
            <span className="hidden sm:inline font-mono text-[10px] text-[#6b8f7e]">
              Session: {sessionId.slice(0, 8)}
            </span>
          )}
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all ${
            isUser
              ? "bg-[#40916c] text-[#ffffff] shadow-sm font-medium"
              : "bg-[#ffffff] border border-[#d8f3dc] text-[#1b4332] shadow-sm"
          }`}
        >
          <div className="whitespace-pre-wrap">{content}</div>

          {!isUser && (
            <SourceChip chunks={sourceChunks} sources={sources} />
          )}
        </div>
      </div>
    </div>
  );
};
