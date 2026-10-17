"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Document } from "@/types";

export interface DocumentStatusBadgeProps {
  status: Document["status"];
  className?: string;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  className = "",
}) => {
  switch (status) {
    case "ready":
      return (
        <Badge variant="success" size="sm" dot className={className}>
          Ready
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="info" size="sm" dot className={className}>
          Vectorizing...
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="warning" size="sm" dot className={className}>
          Queued
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="error" size="sm" dot className={className}>
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size="sm" className={className}>
          {status}
        </Badge>
      );
  }
};
