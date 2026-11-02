import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { Snow } from "@/components/Snow";
import { themeBootScript } from "@/lib/theme";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], weight: ["600", "700"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: process.env.EVENT_NAME || "Secret Santa",
  description: "Losowanie Secret Santa i listy prezentów",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <Snow />
        {children}
      </body>
    </html>
  );
}
