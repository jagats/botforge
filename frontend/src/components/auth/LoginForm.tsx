"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, LoginFormValues } from "@/lib/validations";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { User } from "@/types";

export interface LoginFormProps {
  onSuccess?: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        const profile = await login({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        });

        if (onSuccess) {
          onSuccess(profile);
        } else {
          if (profile.role === "superadmin") {
            router.push("/admin/brands");
          } else {
            router.push("/dashboard");
          }
        }
      } catch (err: any) {
        setServerError(err?.message || "Invalid email or password.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <GlassCard elevated padding="lg" className="w-full max-w-md shadow-2xl">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs shadow-indigo-500/30">
            <span className="text-lg font-black">B</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            BotForge
          </span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1.5">
          Welcome back
        </h1>
        <p className="text-xs text-slate-500">
          Sign in to manage your knowledge base and bot settings
        </p>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-3.5 mb-6 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2.5 animate-shake">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{serverError}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Work Email Address"
          placeholder="alex@acmehealth.com"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email ? formik.errors.email : undefined}
          disabled={formik.isSubmitting}
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••••••"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password ? formik.errors.password : undefined}
          disabled={formik.isSubmitting}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={formik.isSubmitting}
          >
            Sign In to Workspace
          </Button>
        </div>
      </form>

      <div className="text-center mt-6 text-xs text-slate-500">
        Need brand access or new client onboarding?{" "}
        <span className="text-slate-800 font-semibold">Contact your BotForge Administrator</span>
      </div>
    </GlassCard>
  );
};
