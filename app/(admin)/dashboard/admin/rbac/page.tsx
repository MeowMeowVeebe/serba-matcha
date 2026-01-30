"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FormError from "@/components/form/FormError";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonBlock from "@/components/ui/SkeletonBlock";
import { useAlert } from "@/context/AlertContext";

type Role = { id: string; name: string; permissions: { id: string; name: string }[] };
type Permission = { id: string; name: string };

export default function AdminRbacPage() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [permQuery, setPermQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<"permissions" | "roles">("permissions");

  const selectedRole = useMemo(() => roles.find((r) => r.id === selectedRoleId) ?? null, [roles, selectedRoleId]);

  const filteredPermissions = useMemo(() => {
    const q = permQuery.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter((p) => p.name.toLowerCase().includes(q));
  }, [permissions, permQuery]);

  // Group permissions by prefix (before first '.') for easier navigation.
  // Example: admin.users.create -> group "admin"
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const p of filteredPermissions) {
      const name = p.name ?? "";
      const idx = name.indexOf(".");
      const key = idx > 0 ? name.slice(0, idx) : "other";
      (groups[key] ??= []).push(p);
    }

    const entries = Object.entries(groups).map(([group, perms]) => {
      const sorted = perms.slice().sort((a, b) => a.name.localeCompare(b.name));
      return [group, sorted] as const;
    });

    entries.sort((a, b) => {
      if (a[0] === "other") return 1;
      if (b[0] === "other") return -1;
      return a[0].localeCompare(b[0]);
    });

    return entries;
  }, [filteredPermissions]);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Ensure new groups default to expanded.
  useEffect(() => {
    setCollapsedGroups((prev) => {
      const next = { ...prev };
      for (const [g] of groupedPermissions) {
        if (typeof next[g] !== "boolean") next[g] = false;
      }
      return next;
    });
  }, [groupedPermissions]);

  const load = async () => {
    setIsLoading(true);
    setError(null);

    const [rRes, pRes] = await Promise.all([
      fetch("/api/admin/rbac/roles"),
      fetch("/api/admin/rbac/permissions"),
    ]);

    if (rRes.status === 401 || pRes.status === 401) {
      router.push("/dashboard/login");
      return;
    }

    if (rRes.status === 403 || pRes.status === 403) {
      setError("Forbidden: kamu tidak punya akses untuk mengelola RBAC.");
      setIsLoading(false);
      return;
    }

    const rJson = (await rRes.json()) as { roles: Role[] };
    const pJson = (await pRes.json()) as { permissions: Permission[] };

    setRoles(rJson.roles ?? []);
    setPermissions(pJson.permissions ?? []);

    const first = (rJson.roles ?? [])[0]?.id ?? "";
    setSelectedRoleId((prev) => prev || first);

    // Precompute selected map once on initial load to reduce extra render work.
    if (!selectedRoleId && first) {
      const firstRole = (rJson.roles ?? []).find((r) => r.id === first) ?? null;
      if (firstRole) {
        const next: Record<string, boolean> = {};
        for (const p of pJson.permissions ?? []) {
          next[p.id] = firstRole.permissions.some((rp) => rp.id === p.id);
        }
        setSelected(next);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRole) return;
    const next: Record<string, boolean> = {};
    for (const p of permissions) {
      next[p.id] = selectedRole.permissions.some((rp) => rp.id === p.id);
    }
    setSelected(next);
  }, [selectedRole, permissions]);

  const handleSave = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      const permissionIds = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([id]) => id);

      const res = await fetch("/api/admin/rbac/role-permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: selectedRole.id, permissionIds }),
      });

      if (!res.ok) {
        setError("Failed to save role permissions.");
        showAlert("Failed to save role permissions.", { variant: "error" });
        return;
      }

      showAlert("Role permissions saved successfully.", { variant: "success" });
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="btn-row btn-row--between" style={{ alignItems: "baseline" }}>
          <div className="stack-sm">
            <h3>Roles & Permissions</h3>
            <p>Manage permissions per role</p>
          </div>
          <div className="segmented" aria-label="RBAC view">
            <button className={`segmented__btn ${view === "permissions" ? "active" : ""}`} onClick={() => setView("permissions")}>
              Permissions
            </button>
            <button className={`segmented__btn ${view === "roles" ? "active" : ""}`} onClick={() => setView("roles")}>
              Roles
            </button>
          </div>
        </div>
      </div>

      <FormError message={error ?? undefined} />

      {isLoading ? (
        <div className="rbac-grid" aria-busy="true" aria-label="Loading RBAC">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Roles</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td>
                      <SkeletonBlock height={12} width="70%" radius={8} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SkeletonBlock height={18} width="40%" radius={8} />
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonBlock key={i} height={12} width={i % 3 === 0 ? "95%" : "75%"} radius={8} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rbac-grid">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Roles</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <button
                        className="secondary-btn rbac-role-btn"
                        onClick={() => setSelectedRoleId(r.id)}
                        disabled={isSaving}
                      >
                        {r.name}{selectedRoleId === r.id ? " (selected)" : ""}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h4 style={{ margin: 0 }}>{selectedRole ? `Role: ${selectedRole.name}` : "Select role"}</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  className="ghost-btn"
                  value={permQuery}
                  onChange={(e) => setPermQuery(e.target.value)}
                  placeholder="Search permission..."
                  style={{ minWidth: 220 }}
                />
                <button
                  className="secondary-btn"
                  onClick={() => {
                    const next: Record<string, boolean> = { ...selected };
                    for (const p of filteredPermissions) next[p.id] = true;
                    setSelected(next);
                  }}
                  disabled={!selectedRole || isSaving}
                  title="Enable all filtered permissions"
                >
                  Select all
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => {
                    const next: Record<string, boolean> = { ...selected };
                    for (const p of filteredPermissions) next[p.id] = false;
                    setSelected(next);
                  }}
                  disabled={!selectedRole || isSaving}
                  title="Clear all filtered permissions"
                >
                  Clear all
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => {
                    const next: Record<string, boolean> = { ...collapsedGroups };
                    for (const [g] of groupedPermissions) next[g] = false;
                    setCollapsedGroups(next);
                  }}
                  disabled={!selectedRole || isSaving}
                  title="Expand all groups"
                >
                  Expand all
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => {
                    const next: Record<string, boolean> = { ...collapsedGroups };
                    for (const [g] of groupedPermissions) next[g] = true;
                    setCollapsedGroups(next);
                  }}
                  disabled={!selectedRole || isSaving}
                  title="Collapse all groups"
                >
                  Collapse all
                </button>
                <button className="primary-btn" onClick={handleSave} disabled={!selectedRole || isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {view === "roles" ? (
              <div className="table-container" style={{ marginTop: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Permissions count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((r) => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>
                          <span className="badge badge--info">{r.permissions.length}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {view === "permissions" ? (
              <div className="btn-row" style={{ marginTop: 12 }}>
                <button className="primary-btn" onClick={handleSave} disabled={!selectedRole || isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : null}

            <div className="stack" style={{ marginTop: 12 }}>
              {view !== "permissions" ? null : groupedPermissions.length === 0 ? (
                <EmptyState
                  title="No permissions found"
                  description={permQuery.trim() ? "Try changing your permission search keywords." : "Permissions not yet available."}
                  action={
                    permQuery.trim() ? (
                      <button className="secondary-btn" onClick={() => setPermQuery("")}>
                        Reset search
                      </button>
                    ) : null
                  }
                />
              ) : (
                groupedPermissions.map(([group, perms]) => {
                  const collapsed = Boolean(collapsedGroups[group]);
                  const enabledCount = perms.reduce((acc, p) => acc + (selected[p.id] ? 1 : 0), 0);
                  return (
                    <div key={group} className="table-container">
                      <div className="group-header">
                        <button
                          className="secondary-btn"
                          onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }))}
                          disabled={!selectedRole || isSaving}
                          style={{ textAlign: "left" }}
                          title={collapsed ? "Expand group" : "Collapse group"}
                        >
                          {collapsed ? "+" : "-"} {group} <span style={{ opacity: 0.7, fontSize: 12 }}>({enabledCount}/{perms.length})</span>
                        </button>

                        <div className="btn-row">
                          <button
                            className="secondary-btn"
                            onClick={() => {
                              const next: Record<string, boolean> = { ...selected };
                              for (const p of perms) next[p.id] = true;
                              setSelected(next);
                            }}
                            disabled={!selectedRole || isSaving}
                            title="Enable all permissions in this group"
                          >
                            Enable group
                          </button>
                          <button
                            className="secondary-btn"
                            onClick={() => {
                              const next: Record<string, boolean> = { ...selected };
                              for (const p of perms) next[p.id] = false;
                              setSelected(next);
                            }}
                            disabled={!selectedRole || isSaving}
                            title="Disable all permissions in this group"
                          >
                            Clear group
                          </button>
                        </div>
                      </div>

                      {collapsed ? null : (
                        <table>
                          <thead>
                            <tr>
                              <th style={{ width: 80 }}>Enable</th>
                              <th>Permission</th>
                            </tr>
                          </thead>
                          <tbody>
                            {perms.map((p) => (
                              <tr key={p.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(selected[p.id])}
                                    onChange={(e) => setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))}
                                    disabled={!selectedRole || isSaving}
                                  />
                                </td>
                                <td>{p.name}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <p style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              Catatan: perubahan permission akan langsung mempengaruhi akses user yang memiliki role tersebut.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

