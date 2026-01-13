"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, me, type AuthUser } from "@/lib/authClient";

type Row = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isAdmin?: boolean;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const load = async (params?: { q?: string; page?: number }) => {
    setIsLoading(true);
    setError(null);

    const u = await me();
    if (!u.ok) {
      router.push("/login");
      return;
    }
    setUser(u.user);

    const nextQ = params?.q ?? q;
    const nextPage = params?.page ?? page;

    const url = new URL("/api/admin/users", window.location.origin);
    url.searchParams.set("q", nextQ);
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
      | { users?: Row[]; total?: number; page?: number }
      | null;

    setRows(Array.isArray(data?.users) ? data!.users! : []);
    setTotal(typeof data?.total === "number" ? data.total : 0);
    setPage(typeof data?.page === "number" ? data.page : nextPage);
    setIsLoading(false);
  };

  useEffect(() => {
    void load({ q: "", page: 1 });
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

        <Link className="nav-link" href="/dashboard">
          Dashboard
        </Link>
        <Link className="nav-link" href="/settings">
          Settings
        </Link>
        <Link className="nav-link active" href="/admin/users">
          Admin Users
        </Link>

        <button className="nav-link nav-link-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="main">
        <div className="header">
          <h2>Admin - Users</h2>
          <span />
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Daftar User</h3>
            <p>Total: {total}</p>
          </div>

          <div className="action-bar" style={{ justifyContent: "space-between", marginTop: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", minWidth: 240 }}
                placeholder="Cari nama/email..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                className="secondary-btn"
                onClick={() => load({ q, page: 1 })}
                disabled={isLoading}
              >
                Cari
              </button>
              <button
                className="secondary-btn"
                onClick={() => {
                  setQ("");
                  void load({ q: "", page: 1 });
                }}
                disabled={isLoading}
              >
                Reset
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="secondary-btn"
                onClick={() => load({ page: Math.max(1, page - 1) })}
                disabled={isLoading || page <= 1}
              >
                Prev
              </button>
              <span style={{ fontSize: 13, opacity: 0.8 }}>Page {page}</span>
              <button
                className="secondary-btn"
                onClick={() => load({ page: page + 1 })}
                disabled={isLoading || rows.length < pageSize}
              >
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
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Dibuat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.email}</td>
                      <td>{r.isAdmin ? "admin" : "user"}</td>
                      <td>{new Date(r.createdAt).toLocaleString()}</td>
                      <td>
                        <button
                          className="secondary-btn"
                          disabled={isUpdatingRole === r.id}
                          onClick={async () => {
                            setIsUpdatingRole(r.id);
                            try {
                              if (r.isAdmin) {
                                const url = new URL("/api/admin/roles/admin", window.location.origin);
                                url.searchParams.set("userId", r.id);
                                await fetch(url.toString(), { method: "DELETE" });
                              } else {
                                await fetch("/api/admin/roles/admin", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ userId: r.id }),
                                });
                              }
                              await load();
                            } finally {
                              setIsUpdatingRole(null);
                            }
                          }}
                        >
                          {r.isAdmin ? "Remove Admin" : "Make Admin"}
                        </button>
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
