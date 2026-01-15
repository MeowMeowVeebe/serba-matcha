"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_PAGE_SIZE = 20;

type Role = { id: string; name: string };

type Row = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isAdmin?: boolean;
  roles?: Role[];
};

type ApiResponse = {
  users: Row[];
  total: number;
  page: number;
  pageSize: number;
  q?: string;
};

type RolesResponse = {
  roles: { id: string; name: string }[];
};

type QueryState = {
  q: string;
  page: number;
};

export type AdminUsersInitialData = {
  query: QueryState;
  pageSize: number;
  total: number;
  rows: Row[];
  roles: Role[];
};

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n <= 0) return fallback;
  return Math.floor(n);
}

function readQueryFromLocation(): QueryState {
  if (typeof window === "undefined") return { q: "", page: 1 };
  const sp = new URLSearchParams(window.location.search);
  return {
    q: (sp.get("q") ?? "").trim(),
    page: parsePositiveInt(sp.get("page"), 1),
  };
}

function buildSearch(params: QueryState) {
  const sp = new URLSearchParams();
  if (params.q.trim()) sp.set("q", params.q.trim());
  if (params.page > 1) sp.set("page", String(params.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function roleNames(roles?: Role[]) {
  if (!roles?.length) return "-";
  return roles
    .map((r) => r.name)
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .join(", ");
}

export default function UsersClient({ initial }: { initial: AdminUsersInitialData }) {
  const router = useRouter();

  const [query, setQuery] = useState<QueryState>(initial.query);
  const [qInput, setQInput] = useState(initial.query.q);

  const [rows, setRows] = useState<Row[]>(initial.rows);
  const [total, setTotal] = useState(initial.total);
  const [roles, setRoles] = useState<Role[]>(initial.roles);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-user edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [roleSelection, setRoleSelection] = useState<Record<string, boolean>>({});
  const [isSavingUserRoles, setIsSavingUserRoles] = useState(false);

  const pageSize = initial.pageSize ?? DEFAULT_PAGE_SIZE;
  const hasNext = useMemo(() => query.page * pageSize < total, [query.page, pageSize, total]);

  // Sync query when user navigates browser history.
  useEffect(() => {
    const apply = () => {
      const q = readQueryFromLocation();
      setQuery(q);
      setQInput(q.q);
    };

    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);

  const setUrlQuery = (next: Partial<QueryState>) => {
    const merged: QueryState = {
      q: typeof next.q === "string" ? next.q : query.q,
      page: typeof next.page === "number" ? next.page : query.page,
    };
    router.replace(`/admin/users${buildSearch(merged)}`);
    setQuery(merged);
  };

  // Fetch roles only if server did not provide (fallback).
  useEffect(() => {
    if (roles.length) return;
    void (async () => {
      const rolesRes = await fetch("/api/admin/rbac/roles");
      if (rolesRes.status === 401) {
        router.push("/login");
        return;
      }
      if (rolesRes.status === 403) {
        setError("Forbidden: kamu tidak punya akses admin.");
        setRoles([]);
        return;
      }
      const rolesData = (await rolesRes.json().catch(() => null)) as RolesResponse | null;
      setRoles(Array.isArray(rolesData?.roles) ? rolesData!.roles : []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch users on query changes, but skip immediate refetch if server already rendered same query.
  useEffect(() => {
    let mounted = true;

    // If query equals initial query, do nothing.
    if (query.q === initial.query.q && query.page === initial.query.page) return;

    void (async () => {
      setIsLoading(true);
      setError(null);

      const usersUrl = new URL("/api/admin/users", window.location.origin);
      if (query.q) usersUrl.searchParams.set("q", query.q);
      usersUrl.searchParams.set("page", String(query.page));
      usersUrl.searchParams.set("pageSize", String(pageSize));

      const usersRes = await fetch(usersUrl.toString());
      if (!mounted) return;

      if (usersRes.status === 401) {
        router.push("/login");
        return;
      }

      if (usersRes.status === 403) {
        setError("Forbidden: kamu tidak punya akses admin.");
        setRows([]);
        setTotal(0);
        setIsLoading(false);
        return;
      }

      const usersData = (await usersRes.json().catch(() => null)) as ApiResponse | null;

      setRows(Array.isArray(usersData?.users) ? usersData!.users : []);
      setTotal(typeof usersData?.total === "number" ? usersData.total : 0);
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [query.page, query.q, pageSize, router, initial.query.page, initial.query.q]);

  const startEdit = (u: Row) => {
    setEditingUserId(u.id);
    const next: Record<string, boolean> = {};
    for (const r of roles) {
      next[r.id] = Boolean(u.roles?.some((ur) => ur.id === r.id));
    }
    setRoleSelection(next);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setRoleSelection({});
  };

  const saveRoles = async (userId: string) => {
    setIsSavingUserRoles(true);
    try {
      const roleIds = Object.entries(roleSelection)
        .filter(([, v]) => v)
        .map(([id]) => id);

      const res = await fetch("/api/admin/rbac/user-roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roleIds }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError("Gagal menyimpan roles untuk user.");
        return;
      }

      cancelEdit();
      // Re-fetch current page
      const usersUrl = new URL("/api/admin/users", window.location.origin);
      if (query.q) usersUrl.searchParams.set("q", query.q);
      usersUrl.searchParams.set("page", String(query.page));
      usersUrl.searchParams.set("pageSize", String(pageSize));

      const usersRes = await fetch(usersUrl.toString());
      const usersData = (await usersRes.json().catch(() => null)) as ApiResponse | null;
      setRows(Array.isArray(usersData?.users) ? usersData!.users : []);
      setTotal(typeof usersData?.total === "number" ? usersData.total : 0);
    } finally {
      setIsSavingUserRoles(false);
    }
  };

  return (
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
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <button className="secondary-btn" onClick={() => setUrlQuery({ q: qInput, page: 1 })} disabled={isLoading}>
            Cari
          </button>
          <button className="secondary-btn" onClick={() => setUrlQuery({ q: "", page: 1 })} disabled={isLoading}>
            Reset
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="secondary-btn"
            onClick={() => setUrlQuery({ page: Math.max(1, query.page - 1) })}
            disabled={isLoading || query.page <= 1}
          >
            Prev
          </button>
          <span style={{ fontSize: 13, opacity: 0.8 }}>Page {query.page}</span>
          <button className="secondary-btn" onClick={() => setUrlQuery({ page: query.page + 1 })} disabled={isLoading || !hasNext}>
            Next
          </button>
        </div>
      </div>

      {error ? <div className="auth-form-error">{error}</div> : null}

      {isLoading ? (
        <p style={{ marginTop: 12 }}>Loading...</p>
      ) : rows.length === 0 ? (
        <p style={{ marginTop: 12, opacity: 0.8 }}>Tidak ada user yang cocok.</p>
      ) : (
        <div className="table-container" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    {editingUserId === u.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {roles.map((r) => (
                          <label key={r.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                              type="checkbox"
                              checked={Boolean(roleSelection[r.id])}
                              onChange={(e) => setRoleSelection((prev) => ({ ...prev, [r.id]: e.target.checked }))}
                              disabled={isSavingUserRoles}
                            />
                            <span>{r.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      roleNames(u.roles)
                    )}
                  </td>
                  <td>{new Date(u.createdAt).toLocaleString()}</td>
                  <td>
                    {editingUserId === u.id ? (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button className="primary-btn" onClick={() => saveRoles(u.id)} disabled={isSavingUserRoles}>
                          {isSavingUserRoles ? "Saving..." : "Save"}
                        </button>
                        <button className="secondary-btn" onClick={cancelEdit} disabled={isSavingUserRoles}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="secondary-btn" onClick={() => startEdit(u)}>
                        Edit Roles
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
