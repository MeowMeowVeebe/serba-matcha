"use client";

import { ReactNode } from "react";
import { AlertProvider } from "../context/AlertContext"; // pastikan folder context dibuat

type ClientLayoutProps = {
  children: ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  return <AlertProvider>{children}</AlertProvider>;
}
