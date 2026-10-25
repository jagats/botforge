"use client";

import React, { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatMessageProps } from "@/components/chat/ChatMessage";
import { useChat } from "@/hooks/useChat";
import { formatDateTime } from "@/lib/utils";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default function SessionReplayPage({ params }: PageProps) {
  const { sessionId } = use(params);
  const { session, isLoadingSession } = useChat(sessionId);

  if (isLoadingSession) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs font-semibold text-slate-500">
            Loading session conversation history...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <EmptyState
        title="Session Not Found"
        description="The requested chat session history does not exist or has expired."
        action={{
          label: "Back to Playground",
          onClick: () => {},
        }}
      />
    );
  }

  const messages: ChatMessageProps[] = session.messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: formatDateTime(m.created_at),
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <PageHeader
        title="Session History"
        description={`Replaying visitor session started on ${formatDateTime(session.started_at)}.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Chat Playground", href: "/dashboard/chat-playground" },
          { label: `Session ${sessionId.slice(0, 8)}` },
        ]}
        action={
          <Link href="/dashboard/chat-playground">
            <Button variant="secondary" size="sm">
              Back to Playground
            </Button>
          </Link>
        }
      />

      <GlassCard padding="none" className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm">
        <ChatWindow messages={messages} className="flex-1" />
      </GlassCard>
    </div>
  );
}
