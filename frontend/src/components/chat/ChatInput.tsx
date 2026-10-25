"use client";

import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { PiPaperPlaneRightLight } from "react-icons/pi";

export interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
  samplePrompts?: string[];
  onSelectPrompt?: (prompt: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "Ask a question about your knowledge base...",
  disabled = false,
  samplePrompts,
  onSelectPrompt,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on input content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Sample Quick Prompts */}
      {samplePrompts && samplePrompts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-[#6b8f7e] shrink-0">
            Try:
          </span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt?.(prompt)}
              disabled={isLoading || disabled}
              className="px-2.5 py-1 rounded-xl bg-[#f8fbf9] hover:bg-[#d8f3dc] text-[#1b4332] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border border-[#d8f3dc]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div className="relative rounded-2xl border border-[#d8f3dc] bg-[#ffffff] shadow-sm focus-within:border-[#40916c] focus-within:ring-2 focus-within:ring-[#40916c]/20 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="w-full resize-none bg-transparent px-4 py-3 text-sm text-[#1b4332] placeholder:text-[#7a9a8b] focus:outline-none max-h-36 disabled:opacity-60"
        />

        <div className="flex items-center justify-between px-3 pb-2.5">
          <span className="text-[11px] text-[#6b8f7e] hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded-md bg-[#f1faee] font-mono text-[10px] text-[#40916c] border border-[#d8f3dc]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded-md bg-[#f1faee] font-mono text-[10px] text-[#40916c] border border-[#d8f3dc]">Shift + Enter</kbd> for newline
          </span>

          <div className="ml-auto">
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={onSubmit}
              isLoading={isLoading}
              disabled={disabled || !value.trim() || isLoading}
              leftIcon={<PiPaperPlaneRightLight size={15} />}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
