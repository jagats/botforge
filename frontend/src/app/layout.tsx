import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
