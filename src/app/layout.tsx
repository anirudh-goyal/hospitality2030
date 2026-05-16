import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/convex-provider";
import { CaptureFAB } from "@/components/capture-fab";

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

function TopBar() {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.5rem 2rem",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Link href="/arrivals" style={{ textDecoration: "none" }}>
        <span
          className="font-display"
          style={{
            fontSize: "1.5rem",
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          Sense
        </span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <Link
          href="/capture"
          className="font-mono"
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
            textDecoration: "none",
          }}
        >
          Capture
        </Link>
        <span
          className="font-mono"
          style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}
        >
          {today} - Rosewood Hong Kong
        </span>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${geistMono.variable}`}>
      <body>
        <Providers>
          <TopBar />
          {children}
          <CaptureFAB />
        </Providers>
      </body>
    </html>
  );
}
