"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageProps } from "@/components/chat/ChatMessage";
import { useChat } from "@/hooks/useChat";
import { useDocuments } from "@/hooks/useDocuments";

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
    } catch (err: any) {
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
  };

  const samplePrompts = [
    "What are your refund and return terms?",
    "What pricing tiers or plans do you offer?",
    "How can clients contact support?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <PageHeader
        title="Chat Playground & RAG Inspector"
        description="Test your AI bot in real time. Inspect exact chunk citations and vector search results."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Chat Playground" },
        ]}
        badge={
          <Badge variant="purple" size="sm">
            Phase 3 Grounded
          </Badge>
        }
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  readyDocs.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span className="font-medium text-slate-700">
                {readyDocs.length} {readyDocs.length === 1 ? "doc" : "docs"} indexed ({totalChunks} chunks)
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetSession}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              New Session
            </Button>
          </div>
        }
      />

      {/* Warning when 0 docs are ready */}
      {!isLoadingDocs && readyDocs.length === 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs text-amber-800 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              You do not have any ready knowledge base documents yet. The bot will respond with polite fallback answers until documents are ingested.
            </span>
          </div>
          <Link href="/dashboard/documents">
            <Button variant="secondary" size="sm" className="!bg-white">
              Upload Documents →
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

        <div className="p-4 border-t border-slate-200/70 bg-white/70 backdrop-blur-md">
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
