import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/ui/GlassCard";

export default function DocumentsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="space-y-2 pb-6 border-b border-[#e0ece4]">
        <Skeleton height={28} width={260} />
        <Skeleton height={16} width={450} />
      </div>

      {/* Table container skeleton */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#e0ece4]">
            <Skeleton height={20} width={150} />
            <Skeleton height={32} width={110} className="rounded-md" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={52} className="rounded-md" />
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
