"use client";

import React from "react";
import { StatsCard } from "./StatsCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  PiFileTextLight,
  PiCubeLight,
  PiArrowsClockwiseLight,
  PiShieldCheckLight,
} from "react-icons/pi";

export interface StatsGridProps {
  documentCount: number;
  readyCount: number;
  processingCount: number;
  totalChunks: number;
  isLoading?: boolean;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  documentCount,
  readyCount,
  processingCount,
  totalChunks,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Knowledge Documents */}
      <StatsCard
        title="Knowledge Docs"
        value={documentCount}
        subtitle={`${readyCount} active in RAG index`}
        color="indigo"
        icon={<PiFileTextLight size={22} />}
      />

      {/* Vector Chunks in Qdrant */}
      <StatsCard
        title="Vector Chunks"
        value={totalChunks.toLocaleString()}
        subtitle="Indexed in Qdrant"
        color="emerald"
        icon={<PiCubeLight size={22} />}
      />

      {/* Ingestion Queue */}
      <StatsCard
        title="Ingestion Queue"
        value={processingCount}
        subtitle={processingCount > 0 ? "Currently chunking & embedding" : "All files synchronized"}
        color={processingCount > 0 ? "amber" : "cyan"}
        icon={<PiArrowsClockwiseLight size={22} className={processingCount > 0 ? "animate-spin" : ""} />}
      />

      {/* Knowledge Base Status */}
      <StatsCard
        title="Index Health"
        value={readyCount > 0 ? "100%" : "Pending"}
        subtitle="Cosine similarity ready"
        color="purple"
        icon={<PiShieldCheckLight size={22} />}
      />
    </div>
  );
};
