"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentApi } from "@/lib/api";
import { UploadUrlInput, UploadFaqInput } from "@/types";

export const documentQueryKeys = {
  all: ["documents"] as const,
  detail: (id: string) => ["documents", id] as const,
};

export function useDocuments() {
  const queryClient = useQueryClient();

  // Document list with smart polling while documents are processing
  const listQuery = useQuery({
    queryKey: documentQueryKeys.all,
    queryFn: documentApi.list,
    refetchInterval: (query) => {
      const docs = query.state.data?.documents || [];
      const hasProcessing = docs.some(
        (d) => d.status === "processing" || d.status === "pending"
      );
      return hasProcessing ? 5000 : false;
    },
  });

  // Single document query helper
  const useDocumentDetail = (id: string) => {
    return useQuery({
      queryKey: documentQueryKeys.detail(id),
      queryFn: () => documentApi.get(id),
      enabled: !!id,
    });
  };

  // Upload PDF mutation
  const uploadPdfMutation = useMutation({
    mutationFn: (file: File) => documentApi.uploadPdf(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    },
  });

  // Upload URL mutation
  const uploadUrlMutation = useMutation({
    mutationFn: (data: UploadUrlInput) => documentApi.uploadUrl(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    },
  });

  // Upload FAQ mutation
  const uploadFaqMutation = useMutation({
    mutationFn: (data: UploadFaqInput) => documentApi.uploadFaq(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    },
  });

  return {
    documents: listQuery.data?.documents || [],
    total: listQuery.data?.total || 0,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.error,
    refetch: listQuery.refetch,
    useDocumentDetail,
    uploadPdf: uploadPdfMutation.mutateAsync,
    isUploadingPdf: uploadPdfMutation.isPending,
    uploadUrl: uploadUrlMutation.mutateAsync,
    isUploadingUrl: uploadUrlMutation.isPending,
    uploadFaq: uploadFaqMutation.mutateAsync,
    isUploadingFaq: uploadFaqMutation.isPending,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
