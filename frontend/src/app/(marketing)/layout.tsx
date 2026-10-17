import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-mesh font-sans antialiased text-slate-900">
      <Navbar />
      <main className="flex-1 animate-fade-in">{children}</main>
      <Footer />
    </div>
  );
}
