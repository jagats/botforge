"use client";

import React, { useState } from "react";
import { useFormik } from "formik";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { tenantUpdateSchema, TenantUpdateFormValues } from "@/lib/validations";
import { PiBuildingsLight, PiWarningCircleLight } from "react-icons/pi";

export const TenantProfileForm: React.FC = () => {
  const { tenant, updateProfile, isUpdatingProfile } = useTenant();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik<TenantUpdateFormValues>({
    initialValues: {
      name: tenant?.name || "",
    },
    enableReinitialize: true,
    validationSchema: tenantUpdateSchema,
    onSubmit: async (values) => {
      setError(null);
      try {
        await updateProfile({ name: values.name.trim() });
        await refreshUser();
        toast.success("Organization profile updated successfully.");
        setIsEditing(false);
      } catch (err: any) {
        setError(err?.message || "Failed to update profile.");
        toast.error(err?.message || "Update failed");
      }
    },
  });

  return (
    <GlassCard elevated padding="lg" className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#e0ece4]">
        <div>
          <h2 className="text-base font-bold text-[#1b4332] tracking-tight flex items-center gap-2">
            <PiBuildingsLight size={18} className="text-[#40916c]" />
            <span>Organization Profile</span>
          </h2>
          <p className="text-xs text-[#52796f] mt-0.5">
            Manage company brand identity and multi-tenant partitioning settings.
          </p>
        </div>

        {!isEditing && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              formik.resetForm({ values: { name: tenant?.name || "" } });
              setIsEditing(true);
            }}
          >
            Edit Name
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
          <PiWarningCircleLight size={16} className="shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Company Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#52796f]">
            Company Name
          </label>
          {!isEditing ? (
            <p className="text-sm font-bold text-[#1b4332] pt-1">
              {tenant?.name || "—"}
            </p>
          ) : (
            <form onSubmit={formik.handleSubmit} noValidate className="space-y-2 mt-1">
              <Input
                id="name"
                name="name"
                type="text"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name ? formik.errors.name : undefined}
                disabled={isUpdatingProfile}
                autoFocus
              />
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  isLoading={isUpdatingProfile}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    formik.resetForm();
                    setIsEditing(false);
                    setError(null);
                  }}
                  disabled={isUpdatingProfile}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Workspace Slug */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#52796f]">
            Workspace Slug
          </label>
          <div className="pt-1">
            <span className="px-2.5 py-1 rounded-xl bg-[#f8fbf9] border border-[#d8f3dc] font-mono text-xs text-[#1b4332] font-semibold">
              {tenant?.slug || "—"}
            </span>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#52796f]">
            Subscription Tier
          </label>
          <div className="pt-1">
            <Badge variant="purple" size="sm">
              {(tenant?.plan || "Trial").toUpperCase()} PLAN
            </Badge>
          </div>
        </div>

        {/* Tenant Partition ID */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#52796f]">
            Partition Tenant ID
          </label>
          <div className="flex items-center gap-2 pt-1">
            <span
              className="font-mono text-xs text-[#1b4332] font-semibold truncate max-w-[140px]"
              title={tenant?.id}
            >
              {tenant?.id || "—"}
            </span>
            {tenant?.id && <CopyButton text={tenant.id} size="sm" />}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
