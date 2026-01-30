"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { logout, logoutAll, type AuthUser } from "@/lib/authClient";
import PageHeader from "@/components/ui/PageHeader";
import FormError from "@/components/form/FormError";
import NavLink from "@/components/ui/NavLink";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/components/ui/GlobalConfirmDialog";

// Key for storing sidebar scroll position
const SIDEBAR_SCROLL_KEY = "sidebar-scroll-position";

export type AccountShellContext = {
  user: AuthUser | null;
  isLoadingUser: boolean;
  loadError: string | null;
  theme: "dark" | "light";
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
  const { confirm } = useConfirm();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [theme] = useState<"light" | "dark">("dark");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Direct fetch user data (bypass SWR issues)
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          setUser(null);
          setIsLoadingUser(false);
          return;
        }
        const data = await res.json();
        setUser(data?.user ?? null);
      } catch {
        setLoadError("Gagal memuat user.");
      } finally {
        setIsLoadingUser(false);
      }
    }
    fetchUser();
  }, []);

  // Restore sidebar scroll position on mount
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      const savedPosition = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
      if (savedPosition) {
        sidebar.scrollTop = parseInt(savedPosition, 10);
      }
    }
  }, []);

  // Save sidebar scroll position on scroll
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleScroll = () => {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(sidebar.scrollTop));
    };

    sidebar.addEventListener("scroll", handleScroll, { passive: true });
    return () => sidebar.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Notify parent when user loads
  useEffect(() => {
    if (user && onUserLoaded) {
      onUserLoaded(user);
    }
  }, [user, onUserLoaded]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      showAlert("Logout berhasil.", { variant: "info" });
    } finally {
      setIsLoggingOut(false);
      router.push("/dashboard/login");
    }
  };

  const handleLogoutAll = async () => {
    if (isLoggingOutAll) return;
    
    // Show confirmation dialog
    const confirmed = await confirm({
      title: "Logout Semua Device?",
      message: (
        <>
          <p style={{ margin: "0 0 12px" }}>
            Anda akan keluar dari <strong>semua perangkat</strong> yang sedang login, termasuk perangkat ini.
          </p>
          <p style={{ margin: 0, fontSize: "0.9em", opacity: 0.8 }}>
            Semua refresh token akan dicabut. Anda perlu login kembali.
          </p>
        </>
      ),
      confirmText: "Yes, Logout All",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsLoggingOutAll(true);
    try {
      const res = await logoutAll();
      showAlert(res.message ?? "Logout semua device berhasil.", { variant: "success" });
    } finally {
      setIsLoggingOutAll(false);
      router.push("/dashboard/login");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: "Delete Account Permanently?",
      message: (
        <>
          <p style={{ margin: "0 0 12px" }}>
            This action is <strong>permanent and cannot be undone</strong>.
          </p>
          <p style={{ margin: "0 0 12px" }}>
            All your data including:
          </p>
          <ul style={{ margin: "0 0 12px", paddingLeft: "20px" }}>
            <li>Products</li>
            <li>Transaction history</li>
            <li>Account information</li>
          </ul>
          <p style={{ margin: 0, fontSize: "0.9em", opacity: 0.8 }}>
            will be permanently deleted from our system.
          </p>
        </>
      ),
      confirmText: "Yes, Delete My Account",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        showAlert(data.message ?? "Account deleted successfully.", { variant: "success" });
        router.push("/dashboard/login");
      } else {
        showAlert(data.message ?? "Failed to delete account.", { variant: "error" });
      }
    } catch (error) {
      console.error("Delete account error:", error);
      showAlert("An error occurred while deleting account.", { variant: "error" });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return user?.roles?.some((r) => r.toLowerCase() === "admin") ?? false;
  }, [user]);

  // Check if user is seller/penjual
  const isSeller = useMemo(() => {
    return user?.roles?.some((r) => r.toLowerCase() === "seller" || r.toLowerCase() === "penjual") ?? false;
  }, [user]);

  // Check if user is seller-only (not admin) - for menu rendering only
  const isSellerOnly = useMemo(() => {
    return isSeller && !isAdmin;
  }, [isSeller, isAdmin]);

  const navSections = useMemo(
    () => {
      const sections: { title: string; items: { href: string; label: string; icon: React.ReactNode }[] }[] = [];

      // If seller-only (not admin), show only Seller section
      if (isSellerOnly) {
        sections.push({
          title: "Seller",
          items: [
            { href: "/dashboard/seller/dashboard", label: "Seller Dashboard", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M3 5h18v4H3V5zm0 6h18v8H3v-8zm2 2v4h14v-4H5z"/></svg> },
            { href: "/dashboard/seller/products", label: "Products", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M3 4h18v2H3V4zm0 4h18v12H3V8zm2 2v8h14v-8H5zm3 1h4v2H8v-2z"/></svg> },
          ],
        });
        return sections;
      }

      // Regular customer menu
      sections.push({
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
            href: "/home",
            label: "Client Site",
            icon: (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  fill="currentColor"
                  d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-6v-6H10v6H4a1 1 0 0 1-1-1V9.5z"
                />
              </svg>
            ),
          },
          {
            href: "/dashboard/transactions",
            label: "Transactions",
            icon: (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  fill="currentColor"
                  d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"
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
      });

      // Add Admin section if user has admin role
      if (isAdmin) {
        sections.push({
          title: "Admin",
          items: [
            { href: "/dashboard/admin/users", label: "Users", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
            { href: "/dashboard/admin/rbac", label: "RBAC", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg> },
            { href: "/dashboard/admin/audit-logs", label: "Audit Logs", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg> },
          ],
        });
      }

      // Add Seller section if user has seller role (and is not seller-only, since we handled that above)
      if (isSeller && !isSellerOnly) {
        sections.push({
          title: "Seller",
          items: [
            { href: "/dashboard/seller/dashboard", label: "Seller Dashboard", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M3 5h18v4H3V5zm0 6h18v8H3v-8zm2 2v4h14v-4H5z"/></svg> },
            { href: "/dashboard/seller/products", label: "Products", icon: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d="M3 4h18v2H3V4zm0 4h18v12H3V8zm2 2v8h14v-8H5zm3 1h4v2H8v-2z"/></svg> },
          ],
        });
      }

      return sections;
    },
    [isSellerOnly, isAdmin, isSeller],
  );

  return (
    <>
      <div className="sidebar" ref={sidebarRef}>
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
              <NavLink 
                key={n.href} 
                href={n.href}
                className="nav-link"
                activeClassName="active"
                isActive={isActive(pathname, n.href)}
              >
                <span className="nav-link-row">
                  <span className="nav-icon">{n.icon}</span>
                  <span>{n.label}</span>
                </span>
              </NavLink>
            ))}
          </div>
        ))}

        <div className="nav-section">
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

          <div className="nav-button-group">
            <button className="nav-link nav-link-btn" onClick={handleLogoutAll} disabled={isLoggingOutAll}>
              <span className="nav-link-row">
                <span className="nav-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path
                      fill="currentColor"
                      d="M16 13v-2H7V8l-5 4 5 4v-3h9zm4-10H10a2 2 0 0 0-2 2v4h2V5h10v14H10v-4H8v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
                    />
                  </svg>
                </span>
                <span>{isLoggingOutAll ? "Logging out..." : "Logout all devices"}</span>
              </span>
            </button>

            {isSellerOnly && (
              <button 
                className="nav-link nav-link-btn nav-link-danger" 
                onClick={handleDeleteAccount} 
                disabled={isDeletingAccount}
              >
                <span className="nav-link-row">
                  <span className="nav-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="currentColor"
                        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                      />
                    </svg>
                  </span>
                  <span>{isDeletingAccount ? "Deleting..." : "Delete Account"}</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>


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
              <Link className="secondary-btn" href="/dashboard/login">
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




