"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { logout, me, type AuthUser } from "@/lib/authClient";

type LogRow = {
  id: string;
  action: string;
  userId: string | null;
  ip: string | null;
  meta: string | null;
  createdAt: string;
};

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [rows, setRows] = useState<LogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasNext = useMemo(() => rows.length === pageSize, [rows.length, pageSize]);

  const load = async (params?: { action?: string; q?: string; page?: number }) => {
    setIsLoading(true);
    setError(null);

    const u = await me();
    if (!u.ok) {
      router.push("/login");
      return;
    }
    setUser(u.user);

    const nextAction = params?.action ?? action;
    const nextQ = params?.q ?? q;
    const nextPage = params?.page ?? page;

    const url = new URL("/api/admin/audit-logs", window.location.origin);
    if (nextAction) url.searchParams.set("action", nextAction);
    if (nextQ) url.searchParams.set("q", nextQ);
    url.searchParams.set("page", String(nextPage));
    url.searchParams.set("pageSize", String(pageSize));

    const res = await fetch(url.toString());
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.status === 403) {
      setError("Forbidden: kamu bukan admin.");
      setIsLoading(false);
      return;
    }

    const data = (await res.json().catch(() => null)) as
      | { logs?: LogRow[]; total?: number; page?: number }
      | null;

    setRows(Array.isArray(data?.logs) ? data!.logs! : []);
    setTotal(typeof data?.total === "number" ? data.total : 0);
    setPage(typeof data?.page === "number" ? data.page : nextPage);
    setIsLoading(false);
  };

  useEffect(() => {
    void load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      <div className="sidebar">
        <h2>Serba Matchia</h2>
        {user ? (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div className="sidebar-user-meta">
              <p className="sidebar-user-name">{user.name}</p>
              <p className="sidebar-user-email">{user.email}</p>
            </div>
          </div>
        ) : null}

        <Link className="nav-link" href="/dashboard">Dashboard</Link>
        <Link className="nav-link" href="/settings">Settings</Link>
        <Link className="nav-link" href="/admin/users">Admin Users</Link>
        <Link className="nav-link active" href="/admin/audit-logs">Audit Logs</Link>

        <button className="nav-link nav-link-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="main">
        <div className="header">
          <h2>Admin - Audit Logs</h2>
          <span />
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Audit Logs</h3>
            <p>Total: {total}</p>
          </div>

          <div className="action-bar" style={{ justifyContent: "space-between", marginTop: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", minWidth: 220 }}
                placeholder="Filter action (contains)"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              />
              <input
                style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", minWidth: 220 }}
                placeholder="Cari (meta/ip/action)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="secondary-btn" onClick={() => load({ action, q, page: 1 })} disabled={isLoading}>
                Filter
              </button>
              <button
                className="secondary-btn"
                onClick={() => {
                  setAction("");
                  setQ("");
                  void load({ action: "", q: "", page: 1 });
                }}
                disabled={isLoading}
              >
                Reset
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="secondary-btn" onClick={() => load({ page: Math.max(1, page - 1) })} disabled={isLoading || page <= 1}>
                Prev
              </button>
              <span style={{ fontSize: 13, opacity: 0.8 }}>Page {page}</span>
              <button className="secondary-btn" onClick={() => load({ page: page + 1 })} disabled={isLoading || !hasNext}>
                Next
              </button>
            </div>
          </div>

          {error ? <div className="auth-form-error">{error}</div> : null}

          {isLoading ? (
            <p style={{ marginTop: 12 }}>Loading...</p>
          ) : (
            <div className="table-container" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Action</th>
                    <th>UserId</th>
                    <th>IP</th>
                    <th>Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.createdAt).toLocaleString()}</td>
                      <td>{r.action}</td>
                      <td>{r.userId ?? "-"}</td>
                      <td>{r.ip ?? "-"}</td>
                      <td style={{ maxWidth: 360, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.meta ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
