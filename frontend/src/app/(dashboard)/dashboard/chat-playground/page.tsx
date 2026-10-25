"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageProps } from "@/components/chat/ChatMessage";
import { useChat } from "@/hooks/useChat";
import { useDocuments } from "@/hooks/useDocuments";
import { PiArrowsClockwiseLight, PiInfoLight } from "react-icons/pi";

export default function ChatPlaygroundPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content:
        "Welcome to the BotForge Chat Playground! Ask questions about your business, products, or uploaded policies to test how your AI bot responds with grounded document citations.",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const { documents, isLoading: isLoadingDocs } = useDocuments();
  const readyDocs = documents.filter((d) => d.status === "ready");
  const totalChunks = readyDocs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);

  const { sendMessage, isSending } = useChat();

  const samplePrompts = [
    "What services or products are detailed in the knowledge base?",
    "Summarize the key policies or return guidelines.",
    "Can you provide a breakdown of pricing and support tiers?",
  ];

  const handleSend = async () => {
    const text = inputMessage.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessageProps = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      const response = await sendMessage({
        session_id: sessionId,
        message: text,
      });

      if (!sessionId) {
        setSessionId(response.session_id);
      }

      const assistantMessage: ChatMessageProps = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        sourceChunks: response.source_chunks,
        sources: response.sources,
        sessionId: response.session_id,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMsg: ChatMessageProps = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "⚠️ Failed to get a response from the AI assistant. Please check your backend connection or model availability.",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleResetSession = () => {
    setSessionId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content:
          "New conversation session started. Ask questions about your knowledge base to test retrieval.",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInputMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
      <PageHeader
        title="Interactive Chat Playground"
        description="Verify how your chatbot synthesizes grounded responses and produces accurate citation snippets."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Chat Playground" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f8fbf9] border border-[#d8f3dc] text-xs shadow-2xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  readyDocs.length > 0 ? "bg-[#40916c] animate-pulse" : "bg-[#f59e0b]"
                }`}
              />
              <span className="font-semibold text-[#1b4332]">
                {readyDocs.length} {readyDocs.length === 1 ? "doc" : "docs"} indexed ({totalChunks} chunks)
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetSession}
              leftIcon={<PiArrowsClockwiseLight size={16} />}
            >
              New Session
            </Button>
          </div>
        }
      />

      {/* Warning when 0 docs are ready */}
      {!isLoadingDocs && readyDocs.length === 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <PiInfoLight size={18} className="text-amber-600 shrink-0" />
            <span>
              You do not have any ready knowledge base documents yet. The bot will respond with polite fallback answers until documents are ingested.
            </span>
          </div>
          <Link href="/dashboard/documents">
            <Button variant="accent" size="sm">
              Upload Documents
            </Button>
          </Link>
        </div>
      )}

      {/* Chat Conversation Surface */}
      <GlassCard padding="none" className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm">
        <ChatWindow
          messages={messages}
          isLoading={isSending}
          className="flex-1"
        />

        <div className="p-4 border-t border-[#e0ece4] bg-[#ffffff]">
          <ChatInput
            value={inputMessage}
            onChange={setInputMessage}
            onSubmit={handleSend}
            isLoading={isSending}
            samplePrompts={messages.length <= 1 ? samplePrompts : undefined}
            onSelectPrompt={(prompt) => {
              setInputMessage(prompt);
            }}
          />
        </div>
      </GlassCard>
    </div>
  );
}
