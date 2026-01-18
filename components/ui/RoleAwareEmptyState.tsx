"use client";

import type { ReactNode } from "react";

export function RoleAwareEmptyState({
  role,
  title,
  description,
  adminAction,
  userAction,
}: {
  role: "admin" | "user";
  title: string;
  description: string;
  adminAction?: ReactNode;
  userAction?: ReactNode;
}) {
  return (
    <div className="role-empty-state">
      <div className="role-empty-state__badge">{role === "admin" ? "Admin" : "User"}</div>
      <div className="role-empty-state__title">{title}</div>
      <div className="role-empty-state__desc">{description}</div>
      <div className="role-empty-state__actions">{role === "admin" ? adminAction : userAction}</div>
    </div>
  );
}
