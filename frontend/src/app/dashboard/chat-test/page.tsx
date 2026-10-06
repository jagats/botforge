"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { chatApi, documentApi } from "../../../lib/api";
import { ChatResponse, ChatSourceItem } from "../../../types";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceChunks?: ChatSourceItem[];
  sources?: string[];
  createdAt: string;
}

export default function ChatTestPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content:
        "👋 Welcome to the BotForge Chat Playground! Ask questions about your business, products, or uploaded policies to test how your AI bot responds with grounded document citations.",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch document count to display knowledge base health
  const { data: docData, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["documents"],
    queryFn: documentApi.list,
  });

  const readyDocs = docData?.documents.filter((d) => d.status === "ready") || [];
  const totalChunks = readyDocs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);

  // Auto-scroll to bottom of messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mutation for sending chat messages
  const chatMutation = useMutation({
    mutationFn: (messageText: string) => {
      return chatApi.sendMessage({
        session_id: sessionId,
        message: messageText,
      });
    },
    onSuccess: (data: ChatResponse) => {
      if (!sessionId) {
        setSessionId(data.session_id);
      }
      const assistantMsg: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        sourceChunks: data.source_chunks,
        sources: data.sources,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    },
    onError: (err: any) => {
      const errorMsg: DisplayMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "⚠️ Failed to get a response from the AI assistant. Please check your connection or backend status.",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputMessage.trim();
    if (!cleanText || chatMutation.isPending) return;

    // Add user message to UI
    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: cleanText,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    chatMutation.mutate(cleanText);

    // Keep focus in input
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleResetSession = () => {
    setSessionId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content:
          "🔄 New conversation started. Ask questions about your knowledge base to test retrieval.",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setExpandedSources({});
  };

  const toggleSourceExpansion = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const sampleQuestions = [
    "What are your refund and return terms?",
    "What pricing tiers or plans do you offer?",
    "How can clients contact support?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>💬</span> Bot Playground & RAG Inspector
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Phase 3 Live
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Test your bot in real time. Inspect exact chunk citations and vector search results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                readyDocs.length > 0 ? "bg-emerald-400" : "bg-amber-400"
              }`}
            ></span>
            <span>
              {readyDocs.length} {readyDocs.length === 1 ? "doc" : "docs"} indexed ({totalChunks}{" "}
              chunks)
            </span>
          </div>

          <button
            onClick={handleResetSession}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            <span>🔄</span> New Session
          </button>
        </div>
      </div>

      {/* Zero Documents Warning */}
      {!isLoadingDocs && readyDocs.length === 0 && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              You do not have any ready knowledge base documents yet. The bot will respond with
              polite fallback answers until documents are ingested.
            </span>
          </div>
          <Link
            href="/dashboard/documents"
            className="px-3 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 font-semibold underline underline-offset-2 shrink-0 transition"
          >
            Upload Documents →
          </Link>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const hasSources = (msg.sourceChunks && msg.sourceChunks.length > 0) || (msg.sources && msg.sources.length > 0);
          const isExpanded = !!expandedSources[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-3xl ${
                isUser ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-500 px-1">
                <span>{isUser ? "You" : "BotForge Assistant"}</span>
                <span>•</span>
                <span>{msg.createdAt}</span>
                {sessionId && !isUser && (
                  <span className="text-[10px] text-slate-600 font-mono">
                    Session: {sessionId.slice(0, 8)}...
                  </span>
                )}
              </div>

              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Grounding / Citations Accordion for Assistant */}
                {!isUser && hasSources && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => toggleSourceExpansion(msg.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                    >
                      <span>{isExpanded ? "▾ Hide" : "▸ View"}</span>
                      <span>
                        {msg.sourceChunks?.length || msg.sources?.length} Retrieved Context{" "}
                        {(msg.sourceChunks?.length || msg.sources?.length) === 1 ? "Chunk" : "Chunks"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 space-y-2">
                        {msg.sourceChunks?.map((chunk, idx) => (
                          <div
                            key={chunk.chunk_id || idx}
                            className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-semibold text-blue-400">
                                Source #{idx + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-slate-500">
                                  ID: {chunk.chunk_id.slice(0, 8)}...
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                                  Score: {chunk.score.toFixed(3)}
                                </span>
                              </div>
                            </div>
                            <p className="font-mono text-slate-300 text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800/60 whitespace-pre-wrap leading-relaxed">
                              {chunk.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {chatMutation.isPending && (
          <div className="flex flex-col items-start max-w-3xl mr-auto">
            <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-500 px-1">
              <span>BotForge Assistant</span>
              <span>•</span>
              <span>Searching knowledge base...</span>
            </div>
            <div className="rounded-2xl rounded-bl-none px-4 py-3 bg-slate-900 border border-slate-800 text-slate-300 text-sm flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-300"></span>
              </div>
              <span className="text-xs text-slate-400">Retrieving vectors & generating answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions */}
      {messages.length <= 2 && (
        <div className="py-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Try asking:</span>
          {sampleQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setInputMessage(q);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>
      )}

      {/* Input Form Bar */}
      <form
        onSubmit={handleSend}
        className="pt-3 pb-1 border-t border-slate-800/80 flex items-center gap-3"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={chatMutation.isPending}
            placeholder="Ask a question about your knowledge base... (Press Enter to send)"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!inputMessage.trim() || chatMutation.isPending}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-sm font-semibold transition flex items-center gap-2 shrink-0 shadow-sm disabled:cursor-not-allowed"
        >
          {chatMutation.isPending ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
          ) : (
            <span>Send ↵</span>
          )}
        </button>
      </form>
    </div>
  );
}
