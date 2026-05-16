"use client";

import { ConvexProvider } from "convex/react";
import { ReactNode } from "react";
import { convex } from "@/lib/convex-client";

export function Providers({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
