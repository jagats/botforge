"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login after a short delay
    const timer = setTimeout(() => {
      router.push("/login");
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-extrabold text-white mb-6">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-base">
              🤖
            </span>
            <span>BotForge</span>
          </Link>
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl">
            🔒
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Closed Onboarding
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Public workspace self-registration is closed. BotForge client brands are provisioned directly by the agency team.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 mb-6">
          If your brand has already been onboarded, please sign in with your administrator credentials. You will be redirected to the login portal shortly.
        </div>

        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition-all active:scale-[0.98]"
        >
          Go to Sign In &rarr;
        </Link>
      </div>
    </div>
  );
}
