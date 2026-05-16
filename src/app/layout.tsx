import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/convex-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

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
          <TooltipProvider delayDuration={0}>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "16rem",
                "--header-height": "3.5rem",
              } as React.CSSProperties
            }
          >
            <AppSidebar />
            <SidebarInset className="bg-[var(--bg)]">{children}</SidebarInset>
          </SidebarProvider>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
