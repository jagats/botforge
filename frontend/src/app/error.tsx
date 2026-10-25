"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { PiWarningCircleLight } from "react-icons/pi";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled client error caught by error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-mesh font-sans antialiased text-[#1b4332]">
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      <GlassCard elevated padding="lg" className="w-full max-w-md text-center shadow-2xl relative z-10 animate-scale-in rounded-3xl border border-[#d8f3dc]">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 text-2xl font-bold mb-4 shadow-xs">
          <PiWarningCircleLight size={28} />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[#1b4332] mb-2">
          Something went wrong
        </h1>

        <p className="text-xs text-[#52796f] mb-6 leading-relaxed max-w-xs mx-auto">
          {error.message || "An unexpected error occurred while rendering this page."}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => reset()}>
            Try Again
          </Button>
          <Link href="/">
            <Button variant="accent" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
