import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/convex-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { CaptureFAB } from "@/components/capture-fab";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const cormorant = Cormorant_Garamond({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-cormorant",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Sense",
  description: "Staff intelligence layer for Rosewood Hotels",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${cormorant.variable} ${geistMono.variable}`}
    >
      <body>
        <Providers>
          <div className="flex min-h-screen">
            <AppSidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
          <CaptureFAB />
        </Providers>
      </body>
    </html>
  );
}
