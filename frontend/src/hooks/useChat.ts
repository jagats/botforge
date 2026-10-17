"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { chatApi } from "@/lib/api";
import { ChatRequest } from "@/types";

export const chatQueryKeys = {
  session: (sessionId: string) => ["chat", "session", sessionId] as const,
};

export function useChat(sessionId?: string | null) {
  // Query session messages if sessionId is provided
  const sessionQuery = useQuery({
    queryKey: chatQueryKeys.session(sessionId || ""),
    queryFn: () => chatApi.getSession(sessionId!),
    enabled: !!sessionId,
  });

  // Mutation to send a message
  const sendMessageMutation = useMutation({
    mutationFn: (data: ChatRequest) => chatApi.sendMessage(data),
  });

  return {
    session: sessionQuery.data,
    isLoadingSession: sessionQuery.isLoading,
    refetchSession: sessionQuery.refetch,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error,
  };
}
