"use client";

import React, { useState } from "react";
import { useFormik } from "formik";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useBrands } from "@/hooks/useBrands";
import { useToast } from "@/contexts/ToastContext";
import { brandCreateSchema, BrandCreateFormValues } from "@/lib/validations";
import { PLAN_TIERS } from "@/lib/constants";
import { Brand } from "@/types";

export interface BrandCreateFormProps {
  onSuccess?: (brand: Brand) => void;
  onCancel?: () => void;
}

export const BrandCreateForm: React.FC<BrandCreateFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const { createBrand, isCreating } = useBrands();
  const { toast } = useToast();

  const formik = useFormik<BrandCreateFormValues>({
    initialValues: {
      company_name: "",
      email: "",
      password: "",
      plan: "trial",
    },
    validationSchema: brandCreateSchema,
    onSubmit: async (values, { resetForm }) => {
      setServerError(null);
      try {
        const newBrand = await createBrand({
          company_name: values.company_name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          plan: values.plan,
        });
        toast.success(`Client brand "${newBrand.name}" provisioned successfully.`);
        resetForm();
        onSuccess?.(newBrand);
      } catch (err: any) {
        setServerError(err?.message || "Failed to onboard new brand.");
        toast.error(err?.message || "Onboarding failed");
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{serverError}</span>
        </div>
      )}

      <Input
        id="company_name"
        name="company_name"
        type="text"
        label="Company / Brand Name"
        placeholder="e.g. Acme Health Clinic"
        value={formik.values.company_name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.company_name ? formik.errors.company_name : undefined}
        disabled={isCreating}
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Owner Admin Email"
        placeholder="client-admin@acmehealth.com"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.email ? formik.errors.email : undefined}
        disabled={isCreating}
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Temporary Initial Password"
        placeholder="••••••••••••"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password ? formik.errors.password : undefined}
        disabled={isCreating}
        hint="Minimum 8 characters. Share this securely with the client."
      />

      <Select
        id="plan"
        name="plan"
        label="Subscription Plan"
        options={PLAN_TIERS.map((tier) => ({
          label: tier.label,
          value: tier.value,
        }))}
        value={formik.values.plan}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.plan ? formik.errors.plan : undefined}
        disabled={isCreating}
      />

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="purple"
          size="md"
          isLoading={isCreating}
          disabled={isCreating}
        >
          Provision Client Brand
        </Button>
      </div>
    </form>
  );
};
