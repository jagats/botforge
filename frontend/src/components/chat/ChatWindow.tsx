"use client";

import React, { useRef, useEffect } from "react";
import { ChatMessage, ChatMessageProps } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";

export interface ChatWindowProps {
  messages: ChatMessageProps[];
  isLoading?: boolean;
  className?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading = false,
  className = "",
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className={`overflow-y-auto space-y-5 p-4 sm:p-6 ${className}`}>
      {messages.map((msg) => (
        <ChatMessage key={msg.id} {...msg} />
      ))}

      {isLoading && (
        <div className="flex items-start gap-3 animate-fade-in">
          <TypingIndicator />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
