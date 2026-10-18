import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BrandsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-md" />
        ))}
      </div>

      <div className="rounded-md glass-card p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-72 rounded-md" />
          <Skeleton className="h-10 w-48 rounded-md" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
