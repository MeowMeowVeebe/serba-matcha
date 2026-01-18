"use client";

export function RoleAccentBadge({ role }: { role: "admin" | "user" | "ops" }) {
  return <span className={`role-accent role-accent--${role}`}>{role}</span>;
}
