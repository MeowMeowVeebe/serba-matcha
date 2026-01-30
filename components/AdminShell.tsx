"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { logout, me, type AuthUser } from "@/lib/authClient";
import PageHeader from "@/components/ui/PageHeader";
import { CommandBar, type CommandBarItem } from "@/components/ui/CommandBar";
import { StatusIndicators } from "@/components/ui/StatusIndicators";
import { ActionTrail } from "@/components/ui/ActionTrail";
import { KpiTicker } from "@/components/ui/KpiTicker";
import { FocusModeToggle } from "@/components/ui/FocusModeToggle";
import { AmbientModeToggle } from "@/components/ui/AmbientModeToggle";

type Props = {
  title?: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  children: ReactNode;
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminShell({ title, description, breadcrumbs, actions, children }: Props) {
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
        router.push("/dashboard/login");
        return;
      }
      setUser(res.user);
      setIsLoadingUser(false);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const navSections = useMemo(
    () => [
      {
        title: "Main",
        items: [
          {
            href: "/dashboard/home",
            label: "Dashboard",
            icon: (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  fill="currentColor"
                  d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
                />
              </svg>
            ),
          },
          {
            href: "/dashboard/settings",
            label: "Settings",
            icon: (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  fill="currentColor"
                  d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.18 7.18 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.4 1.05.71 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.24.1.51.01.64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"
                />
              </svg>
            ),
          },
          {
            href: "/dashboard/security",
            label: "Security Center",
            icon: (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  fill="currentColor"
                  d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.11-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
                />
              </svg>
            ),
          },
        ],
      },
      {
        title: "Admin",
        items: [
          {
            href: "/dashboard/admin/users",
            label: "Users",
            icon: (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  fill="currentColor"
                  d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z"
                />
              </svg>
            ),
          },
          {
            href: "/dashboard/admin/audit-logs",
            label: "Audit Logs",
            icon: (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  fill="currentColor"
                  d="M3 3h18v2H3V3zm0 14h18v2H3v-2zm0-7h18v2H3v-2z"
                />
              </svg>
            ),
          },
          {
            href: "/dashboard/admin/rbac",
            label: "RBAC",
            icon: (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  fill="currentColor"
                  d="M12 2 4 5v6c0 5 3.4 9.74 8 11 4.6-1.26 8-6 8-11V5l-8-3zm-1 14-4-4 1.41-1.41L11 13.17l5.59-5.58L18 9l-7 7z"
                />
              </svg>
            ),
          },
        ],
      },
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
      router.push("/dashboard/login");
    }
  };

  const commandBarItems = useMemo<CommandBarItem[]>(() => {
    if (pathname.startsWith("/dashboard/admin/users")) {
      return [
        { label: "Invite User", href: "/dashboard/admin/users", variant: "primary" },
        { label: "Manage Roles", href: "/dashboard/admin/rbac", variant: "secondary" },
        { label: "Audit Logs", href: "/dashboard/admin/audit-logs", variant: "ghost" },
      ];
    }
    if (pathname.startsWith("/dashboard/admin/audit-logs")) {
      return [
        { label: "Export Logs", href: "/dashboard/admin/audit-logs", variant: "primary" },
        { label: "Retry Failed", href: "/dashboard/admin/audit-logs", variant: "secondary" },
        { label: "RBAC", href: "/dashboard/admin/rbac", variant: "ghost" },
      ];
    }
    if (pathname.startsWith("/dashboard/admin/rbac")) {
      return [
        { label: "Add Role", href: "/dashboard/admin/rbac", variant: "primary" },
        { label: "Permissions", href: "/dashboard/admin/rbac", variant: "secondary" },
        { label: "Users", href: "/dashboard/admin/users", variant: "ghost" },
      ];
    }
    return [];
  }, [pathname]);

  const statusItems = useMemo(
    () => [
      { label: "Queue", value: "Stable", tone: "info" as const },
      { label: "Exports", value: "Healthy", tone: "success" as const },
      { label: "Audit", value: "Live", tone: "success" as const },
    ],
    [],
  );

  const computedHeader = useMemo(() => {
    const defaultCrumbs = [{ label: "Admin", href: "/admin" }];

    if (title) {
      return {
        title,
        description,
        breadcrumbs: breadcrumbs ?? defaultCrumbs,
        actions,
      };
    }

    if (pathname.startsWith("/dashboard/admin/users")) {
      return {
        title: "Users",
        description: "Kelola roles per user",
        breadcrumbs: [...defaultCrumbs, { label: "Users" }],
        actions,
      };
    }

    if (pathname.startsWith("/dashboard/admin/audit-logs")) {
      return {
        title: "Audit Logs",
        description: "Search and export audit logs",
        breadcrumbs: [...defaultCrumbs, { label: "Audit Logs" }],
        actions,
      };
    }

    if (pathname.startsWith("/dashboard/admin/rbac")) {
      return {
        title: "RBAC",
        description: "Kelola roles & permissions",
        breadcrumbs: [...defaultCrumbs, { label: "RBAC" }],
        actions,
      };
    }

    return {
      title: "Admin",
      description: "Kelola users, audit logs, dan RBAC",
      breadcrumbs: defaultCrumbs,
      actions,
    };
  }, [actions, breadcrumbs, description, pathname, title]);

  return (
    <>
      <div className="sidebar">
        <div className="sidebar__branding">
          <h2>Serba Matchia</h2>
          <StatusIndicators items={statusItems} />
        </div>

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

        {navSections.map((sec) => (
          <div key={sec.title} className="nav-section">
            <div className="nav-section-title">{sec.title}</div>
            {sec.items.map((l) => (
              <Link key={l.href} className={`nav-link ${isActive(pathname, l.href) ? "active" : ""}`} href={l.href}>
                <span className="nav-link-row">
                  <span className="nav-icon">{l.icon}</span>
                  <span>{l.label}</span>
                </span>
              </Link>
            ))}
          </div>
        ))}

        <div className="nav-section">
          <div className="nav-section-title">Account</div>
          <button className="nav-link nav-link-btn" onClick={handleLogout} disabled={isLoggingOut}>
            <span className="nav-link-row">
              <span className="nav-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path
                    fill="currentColor"
                    d="M10.09 15.59 11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
                  />
                </svg>
              </span>
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </span>
          </button>
        </div>
      </div>

      <div className="main">
        <KpiTicker
          items={[
            { label: "Exports", value: "12 queued" },
            { label: "Audit Jobs", value: "Running" },
            { label: "RBAC", value: "Clean" },
            { label: "Latency", value: "110ms" },
          ]}
        />
        <div style={{ padding: "14px 16px" }}>
          <PageHeader
            title={computedHeader.title}
            description={computedHeader.description}
            breadcrumbs={computedHeader.breadcrumbs}
            actions={
              <div className="btn-row">
                {computedHeader.actions}
                <FocusModeToggle />
                <AmbientModeToggle />
              </div>
            }
          />
          <ActionTrail updatedAt={new Date().toLocaleString("id-ID")} updatedBy={user?.name ?? "System"} />
        </div>

        {commandBarItems.length ? (
          <div style={{ padding: "0 16px" }}>
            <CommandBar title="Admin quick actions" helperText="Shortcut actions for admin workflows." items={commandBarItems} />
          </div>
        ) : null}

        {children}
      </div>
    </>
  );
}



