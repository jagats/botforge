"use client";

import React, { useState } from "react";
import { Brand } from "@/types";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { useBrands } from "@/hooks/useBrands";
import { useToast } from "@/contexts/ToastContext";

export interface BrandStatusToggleProps {
  brand: Brand;
}

export const BrandStatusToggle: React.FC<BrandStatusToggleProps> = ({ brand }) => {
  const { updateStatus } = useBrands();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const isActive = brand.status === "active";

  const handleToggle = async (nextChecked: boolean) => {
    setIsUpdating(true);
    const newStatus = nextChecked ? "active" : "suspended";
    try {
      await updateStatus({ tenantId: brand.tenant_id, status: newStatus });
      toast.success(
        `Brand ${brand.name} is now ${newStatus.toUpperCase()}.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update brand status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Toggle
        checked={isActive}
        onChange={handleToggle}
        disabled={isUpdating}
        size="sm"
      />
      <Badge
        variant={isActive ? "success" : "error"}
        size="sm"
        dot
      >
        {isActive ? "Active" : "Suspended"}
      </Badge>
    </div>
  );
};
