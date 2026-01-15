"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { logout, me, type AuthUser } from "@/lib/authClient";

type Props = {
  title?: string;
  children: ReactNode;
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminShell({ title = "Admin", children }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setIsLoadingUser(true);
      const res = await me();
      if (!mounted) return;
      if (!res.ok) {
        router.push("/login");
        return;
      }
      setUser(res.user);
      setIsLoadingUser(false);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const links = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/settings", label: "Settings" },
      { href: "/admin/users", label: "Admin Users" },
      { href: "/admin/audit-logs", label: "Audit Logs" },
      { href: "/admin/rbac", label: "RBAC" },
    ],
    [],
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      router.push("/login");
    }
  };

  return (
    <>
      <div className="sidebar">
        <h2>Serba Matchia</h2>

        {isLoadingUser ? (
          <div className="sidebar-user sidebar-user-skeleton" aria-hidden />
        ) : user ? (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div className="sidebar-user-meta">
              <p className="sidebar-user-name">{user.name}</p>
              <p className="sidebar-user-email">{user.email}</p>
            </div>
          </div>
        ) : null}

        {links.map((l) => (
          <Link key={l.href} className={`nav-link ${isActive(pathname, l.href) ? "active" : ""}`} href={l.href}>
            {l.label}
          </Link>
        ))}

        <button className="nav-link nav-link-btn" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      <div className="main">
        <div className="header">
          <h2>{title}</h2>
          <span />
        </div>

        {children}
      </div>
    </>
  );
}
