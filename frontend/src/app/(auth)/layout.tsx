import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-mesh overflow-x-hidden font-sans antialiased text-[#F5EDE8]">
      {/* Decorative floating ambient orbs */}
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      {/* Auth Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-center animate-fade-in">
        {children}
      </div>
    </div>
  );
}
