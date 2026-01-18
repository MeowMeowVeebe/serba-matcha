"use client";

import { ReactNode } from "react";
import { AlertProvider } from "../context/AlertContext";
import { ToastProvider } from "@/components/ui/ToastManager";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { CommandPalette } from "@/components/ui/CommandPalette";
type ClientLayoutProps = {
  children: ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AlertProvider>
      <ToastProvider>
        <LoadingBar />
        {children}
        <CommandPalette />
      </ToastProvider>
    </AlertProvider>
  );
}
