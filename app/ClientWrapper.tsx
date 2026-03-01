"use client";

import { ReactLenis } from "lenis/react";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <ReactLenis root>{children}</ReactLenis>;
}
