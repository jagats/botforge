import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-[#f1faee] bg-mesh overflow-x-hidden font-sans antialiased text-[#1b4332]">
      {/* Decorative floating ambient clay orbs */}
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      {/* Auth Content */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-center animate-fade-in p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
