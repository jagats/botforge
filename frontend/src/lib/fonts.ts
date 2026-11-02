import { Inter, JetBrains_Mono } from "next/font/google";

// Inter and JetBrains Mono are variable fonts, so we must NOT pin a `weight` array —
// doing so makes Turbopack fail to resolve the font ("queries have exactly one entry").
// The variable axis exposes the full weight range (100–900) through the CSS variable.
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
