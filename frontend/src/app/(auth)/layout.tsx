import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-mesh overflow-hidden font-sans antialiased">
      {/* Decorative floating ambient orbs */}
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      {/* Auth Content */}
      <div className="relative z-10 w-full flex items-center justify-center animate-fade-in">
        {children}
      </div>
    </div>
  );
}
