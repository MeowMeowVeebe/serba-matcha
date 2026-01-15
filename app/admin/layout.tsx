import type { ReactNode } from "react";
import AdminShell from "@/components/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell title="Admin">{children}</AdminShell>;
}
