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
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-[#7A6E68]">
          <span className="font-semibold text-[#C4B4A8]">
            {isUser ? "You" : "BotForge Assistant"}
          </span>
          {createdAt && (
            <>
              <span>•</span>
              <span>{createdAt}</span>
            </>
          )}
          {sessionId && !isUser && (
            <span className="hidden sm:inline font-mono text-[10px] text-[#7A6E68]">
              Session: {sessionId.slice(0, 8)}
            </span>
          )}
        </div>

        <div
          className={`rounded-md px-4 py-3 text-sm leading-relaxed transition-all ${
            isUser
              ? "bg-[#323232] text-[#F5EDE8] border border-[rgba(221,208,200,0.20)] shadow-xs"
              : "bg-[rgba(221,208,200,0.12)] border border-[rgba(221,208,200,0.22)] text-[#F5EDE8] shadow-xs backdrop-blur-xs"
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
