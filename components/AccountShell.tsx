"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { logout, logoutAll, me, type AuthUser } from "@/lib/authClient";
import PageHeader from "@/components/ui/PageHeader";
import FormError from "@/components/form/FormError";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useAlert } from "@/context/AlertContext";

export type AccountShellContext = {
  user: AuthUser | null;
  isLoadingUser: boolean;
  loadError: string | null;
  theme: "dark";
};

type Props = {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  onUserLoaded?: (user: AuthUser) => void;
  children: ReactNode | ((ctx: AccountShellContext) => ReactNode);
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AccountShell({ title, description, breadcrumbs, actions, onUserLoaded, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { showAlert } = useAlert();

  const [theme] = useState<"light" | "dark">("dark");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      setIsLoadingUser(true);
      setLoadError(null);
      const res = await me();
      if (!mounted) return;
      if (!res.ok) {
        setLoadError(res.message ?? "Gagal memuat user.");
        setUser(null);
        setIsLoadingUser(false);
        return;
      }
      setUser(res.user);
      onUserLoaded?.(res.user);
      setIsLoadingUser(false);
    })();

    return () => {
      mounted = false;
    };
  }, [onUserLoaded, router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      showAlert("Logout berhasil.", { variant: "info" });
    } finally {
      setIsLoggingOut(false);
      router.push("/login");
    }
  };

  const handleLogoutAll = async () => {
    if (isLoggingOutAll) return;
    setIsLoggingOutAll(true);
    try {
      const res = await logoutAll();
      showAlert(res.message ?? "Logout semua device.", { variant: "warning" });
    } finally {
      setIsLoggingOutAll(false);
      router.push("/login");
    }
  };

  const navSections = useMemo(
    () => [
      {
        title: "Main",
        items: [
          {
            href: "/dashboard",
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
            href: "/settings",
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
            href: "/security",
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
          {
            href: "/feature-lab",
            label: "Feature Lab",
            icon: (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  fill="currentColor"
                  d="M9 2h6v2h-1v5.59l4.7 4.7-1.4 1.41L12 11.41 6.7 16.7l-1.4-1.41 4.7-4.7V4H9V2z"
                />
              </svg>
            ),
          },
          {
            href: "/feature-spotlight",
            label: "Feature Spotlight",
            icon: (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  fill="currentColor"
                  d="m12 2 3 7 7 .6-5.3 4.6 1.6 7.8L12 18l-6.3 4 1.6-7.8L2 9.6 9 9l3-7z"
                />
              </svg>
            ),
          },
          {
            href: "/interaction-heatmap",
            label: "Heatmap",
            icon: (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  fill="currentColor"
                  d="M12 3a9 9 0 0 0-9 9c0 3.3 1.8 6.3 4.6 7.9l1.4-1.4A7 7 0 1 1 19 12h2a9 9 0 0 0-9-9z"
                />
              </svg>
            ),
          },
        ],
      },
      {
        title: "Analytics",
        items: [
          { href: "/insights-studio", label: "Insights Studio", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg> },
          { href: "/usage-trends", label: "Usage Trends", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg> },
          { href: "/engagement-pulse", label: "Engagement", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg> },
          { href: "/customer-journeys", label: "Journeys", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg> },
        ],
      },
      {
        title: "Features",
        items: [
          { href: "/feature-lab", label: "Feature Lab", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M7 2v2h1v14a4 4 0 0 0 8 0V4h1V2H7zm4 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg> },
          { href: "/feature-spotlight", label: "Spotlight", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="m12 2 3 7 7 .6-5.3 4.6 1.6 7.8L12 18l-6.3 4 1.6-7.8L2 9.6 9 9l3-7z"/></svg> },
          { href: "/experiment-control-room", label: "Experiments", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M7 2v2h1v14a4 4 0 0 0 8 0V4h1V2H7z"/></svg> },
          { href: "/alert-studio", label: "Alerts", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg> },
        ],
      },
      {
        title: "Operations",
        items: [
          { href: "/ops-status-center", label: "Status Center", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> },
          { href: "/incident-war-room", label: "Incidents", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg> },
          { href: "/action-planner", label: "Planner", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg> },
          { href: "/ops-playbook", label: "Playbook", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg> },
        ],
      },
      {
        title: "Admin",
        items: [
          { href: "/admin/users", label: "Users", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3z"/></svg> },
          { href: "/admin/rbac", label: "RBAC", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg> },
          { href: "/admin/audit-logs", label: "Audit Logs", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg> },
        ],
      },
    ],
    [],
  );

  return (
    <>
      <div className="sidebar">
        <div className="sidebar__branding">
          <h2>Serba Matcha</h2>
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
            {sec.items.map((n) => (
              <Link key={n.href} className={`nav-link ${isActive(pathname, n.href) ? "active" : ""}`} href={n.href}>
                <span className="nav-link-row">
                  <span className="nav-icon">{n.icon}</span>
                  <span>{n.label}</span>
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

          <button className="nav-link nav-link-btn" onClick={() => setShowLogoutAllConfirm(true)} disabled={isLoggingOutAll}>
            <span className="nav-link-row">
              <span className="nav-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path
                    fill="currentColor"
                    d="M16 13v-2H7V8l-5 4 5 4v-3h9zm4-10H10a2 2 0 0 0-2 2v4h2V5h10v14H10v-4H8v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
                  />
                </svg>
              </span>
              <span>{isLoggingOutAll ? "Logging out..." : "Logout semua device"}</span>
            </span>
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutAllConfirm}
        title="Logout semua device"
        description={
          "Aksi ini akan mengeluarkan akun kamu dari semua device (semua refresh token dicabut). Kamu perlu login ulang."
        }
        confirmLabel="Ya, logout semua"
        cancelLabel="Batal"
        confirmVariant="danger"
        isConfirming={isLoggingOutAll}
        onCancel={() => setShowLogoutAllConfirm(false)}
        onConfirm={async () => {
          await handleLogoutAll();
        }}
      />

      <div className="main">
        <div className="main-header">
          <PageHeader
            title={title}
            description={description}
            breadcrumbs={breadcrumbs}
            actions={actions ? <div className="btn-row">{actions}</div> : undefined}
          />
        </div>

        <FormError
          message={loadError ?? undefined}
          action={
            loadError ? (
              <Link className="secondary-btn" href="/login">
                Ke Login
              </Link>
            ) : null
          }
        />

        <div className="main-content">
          {typeof children === "function"
            ? (children as (ctx: AccountShellContext) => ReactNode)({ user, isLoadingUser, loadError, theme })
            : children}
        </div>
      </div>
    </>
  );
}
