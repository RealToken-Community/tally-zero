"use client";

import { Web3Provider } from "@/components/Web3Provider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}
