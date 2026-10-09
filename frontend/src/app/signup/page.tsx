"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { useAuth } from "../../contexts/AuthContext";
import { signupSchema, SignupFormValues } from "../../lib/validations";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const formik = useFormik<SignupFormValues>({
    initialValues: {
      company_name: "",
      email: "",
      password: "",
    },
    validationSchema: signupSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        await signup({
          company_name: values.company_name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
        });
        router.push("/dashboard");
      } catch (err: any) {
        setServerError(err?.message || "Failed to create account. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-extrabold text-white mb-6">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-base">
              🤖
            </span>
            <span>BotForge</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">Create your workspace</h1>
          <p className="text-sm text-slate-400">
            Deploy an isolated AI bot grounded in your client&apos;s data
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2.5">
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="company_name">
              Company or Workspace Name
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                formik.touched.company_name && formik.errors.company_name
                  ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500"
                  : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
              }`}
              placeholder="Acme Health Inc."
              value={formik.values.company_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={formik.isSubmitting}
            />
            {formik.touched.company_name && formik.errors.company_name && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <span>•</span>
                <span>{formik.errors.company_name}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="email">
              Work Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                formik.touched.email && formik.errors.email
                  ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500"
                  : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
              }`}
              placeholder="alex@acmehealth.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={formik.isSubmitting}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <span>•</span>
                <span>{formik.errors.email}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="password">
              Password (min. 8 characters)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                formik.touched.password && formik.errors.password
                  ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500"
                  : "border-slate-800 focus:ring-blue-500 focus:border-transparent"
              }`}
              placeholder="••••••••••••"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={formik.isSubmitting}
            />
            {formik.touched.password && formik.errors.password && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <span>•</span>
                <span>{formik.errors.password}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? "Creating workspace..." : "Create Account & Get Started"}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
