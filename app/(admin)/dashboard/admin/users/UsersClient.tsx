"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FormError from "@/components/form/FormError";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonBlock from "@/components/ui/SkeletonBlock";
import { useAlert } from "@/context/AlertContext";

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
  const { showAlert } = useAlert();

  const [query, setQuery] = useState<QueryState>(initial.query);
  const [qInput, setQInput] = useState(initial.query.q);
  const [roleFilterId, setRoleFilterId] = useState<string>("");

  const [rows, setRows] = useState<Row[]>(initial.rows);
  const [total, setTotal] = useState(initial.total);
  const [roles, setRoles] = useState<Role[]>(initial.roles);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-user edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [roleSelection, setRoleSelection] = useState<Record<string, boolean>>({});
  const [isSavingUserRoles, setIsSavingUserRoles] = useState(false);

  // Bulk role assignment state
  const [bulkSelected, setBulkSelected] = useState<Record<string, boolean>>({});
  const [bulkRoleSelection, setBulkRoleSelection] = useState<Record<string, boolean>>({});
  const [isBulkApplying, setIsBulkApplying] = useState(false);

  // Undo snackbar state (for bulk apply)
  const [bulkUndo, setBulkUndo] = useState<null | {
    message: string;
    userIds: string[];
    // previous roles by user id
    prevRoleIdsByUser: Record<string, string[]>;
  }>(null);
  const [isBulkUndoing, setIsBulkUndoing] = useState(false);

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
    router.replace(`/dashboard/admin/users${buildSearch(merged)}`);
    setQuery(merged);
  };

  // Fetch roles only if server did not provide (fallback).
  useEffect(() => {
    if (roles.length) return;
    void (async () => {
      const rolesRes = await fetch("/api/admin/rbac/roles");
      if (rolesRes.status === 401) {
        router.push("/dashboard/login");
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
        router.push("/dashboard/login");
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

  const applyRolesForUser = async (userId: string, roleIds: string[]) => {
    const res = await fetch("/api/admin/rbac/user-roles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, roleIds }),
    });

    if (res.status === 401) {
      router.push("/dashboard/login");
      return false;
    }
    if (!res.ok) {
      setError("Gagal menyimpan roles untuk user.");
      return false;
    }
    return true;
  };

  const saveRoles = async (userId: string) => {
    setIsSavingUserRoles(true);
    try {
      const roleIds = Object.entries(roleSelection)
        .filter(([, v]) => v)
        .map(([id]) => id);

      const ok = await applyRolesForUser(userId, roleIds);
      if (!ok) {
        showAlert("Gagal menyimpan roles untuk user.", { variant: "error" });
        return;
      }

      showAlert("Roles user berhasil disimpan.", { variant: "success" });
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

  const bulkApply = async () => {
    const userIds = Object.entries(bulkSelected)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (!userIds.length) {
      showAlert("Pilih minimal 1 user.", { variant: "warning" });
      return;
    }

    // Snapshot current roles (for undo) from the currently loaded page rows.
    // Note: this reliably supports undo for users that are present in the current page.
    const prevRoleIdsByUser: Record<string, string[]> = {};
    for (const uid of userIds) {
      const u = rows.find((r) => r.id === uid);
      prevRoleIdsByUser[uid] = Array.isArray(u?.roles) ? u!.roles!.map((rr) => rr.id) : [];
    }

    setIsBulkApplying(true);
    try {
      const roleIds = Object.entries(bulkRoleSelection)
        .filter(([, v]) => v)
        .map(([id]) => id);

      let appliedCount = 0;
      for (const uid of userIds) {
        // Apply the same roleIds to all selected users
        // (bulk replace, consistent with single-user edit)
        // eslint-disable-next-line no-await-in-loop
        const ok = await applyRolesForUser(uid, roleIds);
        if (!ok) break;
        appliedCount += 1;
      }

      // Refresh current page
      const usersUrl = new URL("/api/admin/users", window.location.origin);
      if (query.q) usersUrl.searchParams.set("q", query.q);
      usersUrl.searchParams.set("page", String(query.page));
      usersUrl.searchParams.set("pageSize", String(pageSize));
      const usersRes = await fetch(usersUrl.toString());
      const usersData = (await usersRes.json().catch(() => null)) as ApiResponse | null;
      setRows(Array.isArray(usersData?.users) ? usersData!.users : []);
      setTotal(typeof usersData?.total === "number" ? usersData.total : 0);

      if (appliedCount > 0) {
        showAlert(`Roles updated for ${appliedCount} user${appliedCount === 1 ? "" : "s"}.`, { variant: "success" });
        setBulkUndo({
          message: `Roles updated for ${appliedCount} user${appliedCount === 1 ? "" : "s"}.`,
          userIds: userIds.slice(0, appliedCount),
          prevRoleIdsByUser,
        });
      }

      setBulkSelected({});
      setBulkRoleSelection({});
    } finally {
      setIsBulkApplying(false);
    }
  };

  const bulkUndoApply = async () => {
    if (!bulkUndo) return;

    setIsBulkUndoing(true);
    setError(null);
    try {
      for (const uid of bulkUndo.userIds) {
        const prev = bulkUndo.prevRoleIdsByUser[uid] ?? [];
        // eslint-disable-next-line no-await-in-loop
        const ok = await applyRolesForUser(uid, prev);
        if (!ok) break;
      }

      // Refresh current page after undo
      const usersUrl = new URL("/api/admin/users", window.location.origin);
      if (query.q) usersUrl.searchParams.set("q", query.q);
      usersUrl.searchParams.set("page", String(query.page));
      usersUrl.searchParams.set("pageSize", String(pageSize));
      const usersRes = await fetch(usersUrl.toString());
      const usersData = (await usersRes.json().catch(() => null)) as ApiResponse | null;
      setRows(Array.isArray(usersData?.users) ? usersData!.users : []);
      setTotal(typeof usersData?.total === "number" ? usersData.total : 0);

      setBulkUndo(null);
    } finally {
      setIsBulkUndoing(false);
    }
  };

  const filteredRows = useMemo(() => {
    if (!roleFilterId) return rows;
    return rows.filter((u) => Array.isArray(u.roles) && u.roles.some((r) => r.id === roleFilterId));
  }, [rows, roleFilterId]);

  const UsersTableSkeleton = () => (
    <div className="table-container" style={{ marginTop: 12 }} aria-busy="true" aria-label="Loading users">
      <table>
        <thead>
          <tr>
            <th style={{ width: 44 }} />
            <th>Nama</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Dibuat</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: 6 }).map((__, j) => (
                <td key={j}>
                  <SkeletonBlock height={12} width={j === 3 ? "80%" : "60%"} radius={8} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

 return (
   <div className="card">
     <div className="card-header">
       <h3 style={{ margin: 0 }}>Daftar</h3>
       <p>Total: {total}</p>
     </div>

     <div className="role-coverage">
       <div>
         <p className="role-coverage__title">Role coverage radar</p>
         <p className="role-coverage__note">Distribusi role aktif untuk pantau keseimbangan akses.</p>
       </div>
       <div className="role-coverage__chart">
         {[
           { label: "Admin", value: 72 },
           { label: "Ops", value: 55 },
           { label: "Finance", value: 38 },
           { label: "Support", value: 64 },
         ].map((item) => (
           <div key={item.label} className="role-coverage__item">
             <span>{item.label}</span>
             <div className="role-coverage__bar">
               <span style={{ width: `${item.value}%` }} />
             </div>
             <strong>{item.value}%</strong>
           </div>
         ))}
       </div>
     </div>

     <div className="onboarding-progress">
       <div>
         <p className="onboarding-progress__title">Onboarding progress</p>
         <p className="onboarding-progress__note">7 user baru belum menyelesaikan setup profile.</p>
       </div>
       <div className="onboarding-progress__ring">
         <span>68%</span>
       </div>
     </div>

     <div className="dormant-watchlist">
       <div>
         <p className="dormant-watchlist__title">Dormant users watchlist</p>
         <p className="dormant-watchlist__note">User tidak aktif lebih dari 30 hari.</p>
       </div>
       <div className="dormant-watchlist__list">
         <span>rian@serba.co</span>
         <span>citra@serba.co</span>
         <span>team.ops@serba.co</span>
       </div>
     </div>

     <div className="role-rotation">
       <div>
         <p className="role-rotation__title">Role rotation reminder</p>
         <p className="role-rotation__note">3 admin belum rotate role dalam 90 hari.</p>
       </div>
       <button className="secondary-btn" type="button">Schedule review</button>
     </div>

     <div className="access-review">
       <div>
         <p className="access-review__title">Access review queue</p>
         <p className="access-review__note">5 user perlu verifikasi akses bulan ini.</p>
       </div>
       <button className="secondary-btn" type="button">Open queue</button>
     </div>

     <div className="ramp-up-tracker">
       <div>
         <p className="ramp-up-tracker__title">New hire ramp-up tracker</p>
         <p className="ramp-up-tracker__note">3 user baru on-track, 2 butuh mentoring.</p>
       </div>
       <button className="secondary-btn" type="button">View progress</button>
     </div>

     <div className="role-drift">
       <div>
         <p className="role-drift__title">Role drift detector</p>
         <p className="role-drift__note">2 user punya akses di luar scope.</p>
       </div>
       <button className="secondary-btn" type="button">Review drift</button>
     </div>

     <div className="panel">
       <div className="btn-row btn-row--between">
         <b>Bulk roles</b>
         <button className="primary-btn" onClick={() => void bulkApply()} disabled={isBulkApplying}>
           {isBulkApplying ? "Applying..." : "Apply to selected"}
         </button>
       </div>
       <div className="role-grid">
         {roles.map((r) => (
           <label key={r.id} className="check-row">
             <input
               type="checkbox"
               checked={Boolean(bulkRoleSelection[r.id])}
               onChange={(e) => setBulkRoleSelection((prev) => ({ ...prev, [r.id]: e.target.checked }))}
               disabled={isBulkApplying}
             />
             <span>{r.name}</span>
           </label>
         ))}
       </div>
       <p className="helper-text">
         Pilih user via checkbox di tabel, lalu pilih roles di sini. Aksi ini akan <b>mengganti</b> roles user terpilih.
       </p>
     </div>

      <div className="action-bar" style={{ justifyContent: "space-between", marginTop: 12 }}>
        <div className="btn-row">
          <input
            className="ghost-btn"
            placeholder="Cari nama/email..."
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            style={{ minWidth: 240 }}
          />
          <select className="ghost-btn" value={roleFilterId} onChange={(e) => setRoleFilterId(e.target.value)} style={{ padding: 8, minWidth: 180 }}>
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button className="secondary-btn secondary-btn--sm" onClick={() => setUrlQuery({ q: qInput, page: 1 })} disabled={isLoading}>
            Cari
          </button>
          <button className="secondary-btn secondary-btn--sm" onClick={() => setUrlQuery({ q: "", page: 1 })} disabled={isLoading}>
            Reset
          </button>
        </div>

        <div className="btn-row">
          <button
            className="secondary-btn secondary-btn--sm"
            onClick={() => setUrlQuery({ page: Math.max(1, query.page - 1) })}
            disabled={isLoading || query.page <= 1}
          >
            Prev
          </button>
          <span style={{ fontSize: 13, opacity: 0.8 }}>Page {query.page}</span>
          <button className="secondary-btn secondary-btn--sm" onClick={() => setUrlQuery({ page: query.page + 1 })} disabled={isLoading || !hasNext}>
            Next
          </button>
        </div>
      </div>

      <FormError
        message={error ?? undefined}
        action={
          error ? (
            <button className="secondary-btn" onClick={() => setUrlQuery({ page: query.page })} disabled={isLoading}>
              Retry
            </button>
          ) : null
        }
      />

      {isLoading ? (
        <UsersTableSkeleton />
      ) : filteredRows.length === 0 ? (
        <div style={{ marginTop: 12 }}>
          <EmptyState
            title="Tidak ada user"
            description={query.q ? "Coba ubah kata kunci pencarian." : "Belum ada user yang cocok."}
            action={
              query.q ? (
                <button className="secondary-btn" onClick={() => setUrlQuery({ q: "", page: 1 })}>
                  Reset filter
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="table-container" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={rows.length > 0 && rows.every((u) => bulkSelected[u.id])}
                    onChange={(e) => {
                      const v = e.target.checked;
                      const next: Record<string, boolean> = { ...bulkSelected };
                      for (const u of rows) next[u.id] = v;
                      setBulkSelected(next);
                    }}
                    disabled={isBulkApplying}
                  />
                </th>
                <th>Nama</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select user ${u.email}`}
                      checked={Boolean(bulkSelected[u.id])}
                      onChange={(e) => setBulkSelected((prev) => ({ ...prev, [u.id]: e.target.checked }))}
                      disabled={isBulkApplying}
                    />
                  </td>
                  <td>
                    <div className="btn-row" style={{ gap: 8 }}>
                      <span>{u.name}</span>
                      {u.isAdmin ? <span className="badge badge--info">Admin</span> : null}
                    </div>
                  </td>
                  <td className="text-truncate" style={{ maxWidth: 320 }}>{u.email}</td>
                  <td>
                    {editingUserId === u.id ? (
                      <div className="stack-sm">
                        {roles.map((r) => (
                          <label key={r.id} className="check-row">
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
                      <div className="btn-row" style={{ gap: 6 }}>
                        {Array.isArray(u.roles) && u.roles.length ? (
                          u.roles.slice(0, 3).map((r) => (
                            <span key={r.id} className="badge badge--info">
                              {r.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ opacity: 0.75 }}>-</span>
                        )}
                        {Array.isArray(u.roles) && u.roles.length > 3 ? (
                          <span className="badge badge--info">+{u.roles.length - 3}</span>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td>{new Date(u.createdAt).toLocaleString()}</td>
                  <td>
                    {editingUserId === u.id ? (
                      <div className="btn-row">
                        <button className="primary-btn" onClick={() => saveRoles(u.id)} disabled={isSavingUserRoles}>
                          {isSavingUserRoles ? "Saving..." : "Save"}
                        </button>
                        <button className="secondary-btn secondary-btn--sm" onClick={cancelEdit} disabled={isSavingUserRoles}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="secondary-btn secondary-btn--sm" onClick={() => startEdit(u)}>
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

      {bulkUndo ? (
        <div role="status" aria-live="polite" className="bottom-toast">
          <div className="bottom-toast__card">
            <span style={{ fontSize: 13, opacity: 0.95 }}>{bulkUndo.message}</span>
            <div className="btn-row">
              <button
                className="secondary-btn secondary-btn--sm"
                onClick={() => void bulkUndoApply()}
                disabled={isBulkApplying || isBulkUndoing}
                title="Undo bulk role update"
              >
                {isBulkUndoing ? "Undoing..." : "Undo"}
              </button>
              <button className="secondary-btn secondary-btn--sm" onClick={() => setBulkUndo(null)} disabled={isBulkUndoing}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


