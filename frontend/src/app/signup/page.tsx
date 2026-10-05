"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated, isLoading } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (companyName.trim().length < 2) {
      setError("Company name must be at least 2 characters.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        company_name: companyName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2.5">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="company">
              Company or Workspace Name
            </label>
            <input
              id="company"
              type="text"
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Acme Health Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="email">
              Work Email Address
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="alex@acmehealth.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="password">
              Password (min. 8 characters)
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating workspace..." : "Create Account & Get Started"}
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
