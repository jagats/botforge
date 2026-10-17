import type { Metadata } from "next";
import "./globals.css";
import { inter, jetbrainsMono } from "../lib/fonts";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "BotForge — AI Bot-as-a-Service Platform",
  description: "Deploy grounded AI chatbots on your website in minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-mesh font-sans antialiased text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
