"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, LoginFormValues } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { User } from "@/types";
import {
  PiEnvelopeLight,
  PiLockLight,
  PiEyeLight,
  PiEyeSlashLight,
  PiShieldCheckLight,
  PiWarningCircleLight,
} from "react-icons/pi";

export interface LoginFormProps {
  onSuccess?: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-md glass-card-elevated shadow-2xl border border-[rgba(255,248,245,0.22)]">
      {/* Mobile-only logo display */}
      <div className="lg:hidden flex justify-center mb-6">
        <Logo size="md" />
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-[#F5EDE8] mb-1.5">
          Welcome back
        </h2>
        <p className="text-xs text-[#C4B4A8]">
          Sign in to access your AI knowledge base & bot configuration
        </p>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-3 mb-5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
          <PiWarningCircleLight size={18} className="shrink-0 text-rose-400" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Work Email Address"
          placeholder="admin@brand.com"
          leftIcon={<PiEnvelopeLight size={18} />}
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email ? formik.errors.email : undefined}
          disabled={formik.isSubmitting}
        />

        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          label="Password"
          placeholder="••••••••••••"
          leftIcon={<PiLockLight size={18} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-[#C4B4A8] hover:text-[#F5EDE8] transition-colors cursor-pointer"
            >
              {showPassword ? <PiEyeSlashLight size={18} /> : <PiEyeLight size={18} />}
            </button>
          }
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password ? formik.errors.password : undefined}
          disabled={formik.isSubmitting}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="accent"
            size="md"
            fullWidth
            isLoading={formik.isSubmitting}
          >
            Sign In to Workspace →
          </Button>
        </div>
      </form>

      {/* Security footer */}
      <div className="mt-6 pt-5 border-t border-[rgba(221,208,200,0.15)] flex items-center justify-center gap-1.5 text-[11px] text-[#7A6E68]">
        <PiShieldCheckLight size={16} className="text-[#DDD0C8]" />
        <span>Secured with JWT Enterprise Authentication</span>
      </div>

      <div className="text-center mt-4 text-[11px] text-[#7A6E68]">
        Need brand access or onboarding?{" "}
        <span className="text-[#DDD0C8] font-medium">Contact your BotForge Admin</span>
      </div>
    </div>
  );
};
