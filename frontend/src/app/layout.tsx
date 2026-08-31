import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Thirteen",
  description: "A real-time Tiến lên table for 2-4 players.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toast />
        <ReconnectOverlay />
      </body>
    </html>
  );
}
