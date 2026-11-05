import React from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-mesh font-sans antialiased text-[#1b4332]">
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      <GlassCard elevated padding="lg" className="w-full max-w-md text-center shadow-lg relative z-10 animate-scale-in rounded-3xl border border-[#d8f3dc]">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-[#d8f3dc] text-[#1b4332] border border-[#b7e4c7] text-2xl font-black mb-4 shadow-xs">
          404
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[#1b4332] mb-2">
          Page Not Found
        </h1>

        <p className="text-xs text-[#52796f] mb-6 leading-relaxed max-w-xs mx-auto">
          The page or resource you are looking for does not exist or has been moved to another route.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button variant="secondary" size="sm">
              Return Home
            </Button>
          </Link>
          <Link href="/admin/brands">
            <Button variant="secondary" size="sm">
              Admin Portal
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="accent" size="sm">
              Client Dashboard
            </Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
