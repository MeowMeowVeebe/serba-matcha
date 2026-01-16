"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Role = { id: string; name: string; permissions: { id: string; name: string }[] };
type Permission = { id: string; name: string };

export default function AdminRbacPage() {
  const router = useRouter();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [permQuery, setPermQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedRole = useMemo(() => roles.find((r) => r.id === selectedRoleId) ?? null, [roles, selectedRoleId]);

  const filteredPermissions = useMemo(() => {
    const q = permQuery.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter((p) => p.name.toLowerCase().includes(q));
  }, [permissions, permQuery]);

  const load = async () => {
    setIsLoading(true);
    setError(null);

    const [rRes, pRes] = await Promise.all([
      fetch("/api/admin/rbac/roles"),
      fetch("/api/admin/rbac/permissions"),
    ]);

    if (rRes.status === 401 || pRes.status === 401) {
      router.push("/login");
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
        setError("Gagal menyimpan role permissions.");
        return;
      }

      await load();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>RBAC: Roles & Permissions</h3>
        <p>Kelola permission per role</p>
      </div>

      {error ? <div className="auth-form-error">{error}</div> : null}

      {isLoading ? (
        <p style={{ marginTop: 12 }}>Loading...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, marginTop: 12 }}>
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
                        className="secondary-btn"
                        style={{ width: "100%", textAlign: "left" }}
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
              <h4 style={{ margin: 0 }}>{selectedRole ? `Role: ${selectedRole.name}` : "Pilih role"}</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  value={permQuery}
                  onChange={(e) => setPermQuery(e.target.value)}
                  placeholder="Search permission..."
                  style={{ padding: 8, borderRadius: 10, border: "1px solid rgba(0,0,0,0.14)", minWidth: 200 }}
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
                <button className="primary-btn" onClick={handleSave} disabled={!selectedRole || isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            <div className="table-container" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Enable</th>
                    <th>Permission</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map((p) => (
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
