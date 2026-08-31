import type { Metadata } from "next";
import { Baloo_2, Geist, Geist_Mono } from "next/font/google";
import ReconnectOverlay from "@/components/ReconnectOverlay";
import Toast from "@/components/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Friendly rounded display font for headings/CTAs (ui_ux.md "Direction
// (revised)"); body copy stays on Geist Sans for legibility.
const balooDisplay = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Thirteen",
  description: "A real-time Tiến lên table for 2-4 players.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${balooDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toast />
        <ReconnectOverlay />
      </body>
    </html>
  );
}
