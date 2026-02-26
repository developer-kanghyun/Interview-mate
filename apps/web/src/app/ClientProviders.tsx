"use client";

import type { PropsWithChildren } from "react";
import { ToastProvider } from "@/shared/ui/toast/ToastProvider";

export function ClientProviders({ children }: PropsWithChildren) {
  return <ToastProvider>{children}</ToastProvider>;
}
