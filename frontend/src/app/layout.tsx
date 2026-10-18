import type { Metadata } from "next";
import "./globals.css";
import { inter, jetbrainsMono } from "../lib/fonts";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: {
    default: "BotForge — Grounded AI Bot-as-a-Service Platform",
    template: "%s | BotForge",
  },
  description:
    "Deploy strictly-grounded, multi-tenant AI customer support chatbots on your website in minutes. Powered by LangChain, FastAPI, and Qdrant vector memory.",
  keywords: [
    "AI Chatbot",
    "RAG",
    "Qdrant",
    "LangChain",
    "Multi-tenant AI",
    "BotForge",
    "Customer Support AI",
  ],
  authors: [{ name: "BotForge Team" }],
  openGraph: {
    title: "BotForge — Grounded AI Bot-as-a-Service Platform",
    description:
      "Deploy strictly-grounded, multi-tenant AI customer support chatbots on your website in minutes.",
    url: "https://botforge.ai",
    siteName: "BotForge",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BotForge — Grounded AI Bot-as-a-Service Platform",
    description:
      "Deploy strictly-grounded, multi-tenant AI customer support chatbots on your website in minutes.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
