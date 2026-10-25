"use client";

import React, { useState } from "react";
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
  PiShieldCheckLight,
  PiWarningCircleLight,
  PiUserLight,
} from "react-icons/pi";

export interface LoginFormProps {
  onSuccess?: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
    <div className="w-full max-w-md mx-auto py-2">
      {/* Mobile-only logo display */}
      <div className="lg:hidden flex justify-center mb-6">
        <Logo size="md" />
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b4332] mb-1">
          Sign In
        </h2>
        <p className="text-xs sm:text-sm text-[#52796f]">
          Enter your workspace credentials to access your assistant configuration.
        </p>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-shake shadow-2xs">
          <PiWarningCircleLight size={18} className="shrink-0 text-rose-500" />
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
          leftIcon={<PiUserLight size={18} />}
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
              className="text-xs font-semibold text-[#40916c] hover:text-[#2d6a4f] transition-colors cursor-pointer px-1 py-0.5 rounded-md"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          }
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password ? formik.errors.password : undefined}
          disabled={formik.isSubmitting}
        />

        {/* Remember me and Help links */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[#3f5e50]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-[#d8f3dc] text-[#40916c] focus:ring-[#40916c] cursor-pointer"
            />
            <span>Remember me</span>
          </label>

          <span className="text-[#40916c] font-semibold hover:underline cursor-pointer">
            Forgot Password?
          </span>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="accent"
            size="md"
            fullWidth
            isLoading={formik.isSubmitting}
            className="h-11 shadow-md text-sm"
          >
            Sign In to Workspace
          </Button>
        </div>
      </form>

      {/* Security footer */}
      <div className="mt-6 pt-5 border-t border-[#e0ece4] flex items-center justify-center gap-1.5 text-xs text-[#6b8f7e]">
        <PiShieldCheckLight size={16} className="text-[#40916c]" />
        <span>Secured with JWT Enterprise Multi-Tenant Protection</span>
      </div>

      <div className="text-center mt-3 text-xs text-[#6b8f7e]">
        Need brand access or onboarding?{" "}
        <span className="text-[#40916c] font-semibold">Contact your BotForge Admin</span>
      </div>
    </div>
  );
};
