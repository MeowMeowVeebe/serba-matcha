"use client";

import type { ReactNode } from "react";
import { AlertProvider } from "@/context/AlertContext";
import { GlobalConfirmProvider } from "@/components/ui/GlobalConfirmDialog";

type ClientLayoutProps = {
  children: ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AlertProvider>
      <GlobalConfirmProvider>{children}</GlobalConfirmProvider>
    </AlertProvider>
  );
}
